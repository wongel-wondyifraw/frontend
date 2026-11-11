import {
  addFamilyChild,
  createFamily,
  deleteFamilyChild,
  getFamilyByMember,
  updateFamily,
} from "@/services/api";
import {
  decodeLeaderValue,
  encodeLeaderValue,
} from "@/Components/common/SpouseSelect";
import {
  computeAgeFromFieldValue,
  fromEntityDate,
  toApiDateFields,
  type CalendarDateFieldValue,
  type CalendarSystem,
  type DatePrecision,
} from "@/lib/ethiopian-calendar";
import {
  normalizePersonName,
  normalizeTitleInitials,
} from "@/lib/name-normalizer";
import type { Family } from "@/types";

type ChildForm = {
  name?: string;
  date_of_birth?: CalendarDateFieldValue | string | null;
};

type FamilyFormValues = {
  marital_status?: string;
  gender?: string;
  has_children?: boolean;
  children?: ChildForm[];
  spouse_from_church?: "yes" | "no";
  internal_spouse_id?: string;
  external_spouse_name?: string;
  external_spouse_phone?: string;
  external_spouse_church?: string;
  skip_spouse_info?: boolean;
};

type ChildWritePayload = {
  name: string;
  age?: number;
  date_of_birth?: string | null;
  date_of_birth_precision?: DatePrecision;
  date_of_birth_calendar?: CalendarSystem;
};

function childPayload(child: ChildForm): ChildWritePayload | null {
  const name = normalizePersonName(child.name ?? "");
  if (!name) return null;

  const dateFields = toApiDateFields(child.date_of_birth, "date_of_birth", {
    clearAsNull: false,
  });

  const age =
    child.date_of_birth && typeof child.date_of_birth === "object"
      ? computeAgeFromFieldValue(child.date_of_birth)
      : undefined;

  return {
    name,
    age,
    ...(dateFields as Omit<ChildWritePayload, "name" | "age">),
  };
}

function buildFamilyPayload(
  memberId: string,
  values: FamilyFormValues,
): Record<string, unknown> | null {
  const status = (values.marital_status || "").toLowerCase();
  const gender = (values.gender || "").toLowerCase();
  const children = (values.children || [])
    .map(childPayload)
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  if (status === "married") {
    const payload: Record<string, unknown> = {
      name: undefined,
    };

    if (gender === "male") {
      payload.husband_id = memberId;
      payload.husband_type = "member";
    } else if (gender === "female") {
      payload.wife_id = memberId;
      payload.wife_type = "member";
    } else {
      payload.husband_id = memberId;
      payload.husband_type = "member";
    }

    if (values.spouse_from_church === "yes" && values.internal_spouse_id) {
      const decoded = decodeLeaderValue(values.internal_spouse_id);
      const spouseId = decoded.leader_id || values.internal_spouse_id;
      const spouseType = decoded.leader_type || "member";
      if (gender === "male") {
        payload.wife_id = spouseId;
        payload.wife_type = spouseType;
      } else {
        payload.husband_id = spouseId;
        payload.husband_type = spouseType;
      }
      payload.spouse_status = "registered";
    } else if (values.spouse_from_church === "no" && values.external_spouse_name) {
      payload.spouse_status = "external";
      payload.external_spouse_name = normalizePersonName(
        values.external_spouse_name,
      );
      payload.external_spouse_phone = values.external_spouse_phone?.trim();
      payload.external_spouse_church = values.external_spouse_church?.trim()
        ? normalizeTitleInitials(values.external_spouse_church)
        : undefined;
    } else if (values.skip_spouse_info || !values.spouse_from_church) {
      payload.spouse_status = "pending";
    } else {
      return null;
    }

    return { ...payload, _children: children };
  }

  if (
    ["single", "divorced", "widowed"].includes(status) &&
    values.has_children &&
    children.length > 0
  ) {
    const payload: Record<string, unknown> = {
      spouse_status: "none",
    };
    if (gender === "female") {
      payload.wife_id = memberId;
      payload.wife_type = "member";
    } else {
      payload.husband_id = memberId;
      payload.husband_type = "member";
    }
    return { ...payload, _children: children };
  }

  return null;
}

async function syncChildren(
  familyId: string,
  children: ChildWritePayload[],
  existing?: Family | null,
) {
  const existingChildren = existing?.children || [];
  for (const child of existingChildren) {
    await deleteFamilyChild(familyId, child.id).catch(() => undefined);
  }
  for (const child of children) {
    await addFamilyChild(familyId, child);
  }
}

/** Map an existing family into form fields for Edit Member. */
export function familyToFormValues(
  family: Family | null,
  memberId: string,
): Record<string, unknown> {
  if (!family) return { has_children: false, children: [] };

  const isHusband = family.husband_id === memberId;
  const otherId = isHusband ? family.wife_id : family.husband_id;
  const otherType = isHusband ? family.wife_type : family.husband_type;
  const status = (family.spouse_status || "").toLowerCase();

  const children = (family.children || []).map((c) => ({
    name: c.name,
    date_of_birth: c.date_of_birth
      ? fromEntityDate(
          c.date_of_birth,
          c.date_of_birth_precision ?? "day",
          c.date_of_birth_calendar ?? "gc",
        )
      : undefined,
  }));

  const base: Record<string, unknown> = {
    has_children: children.length > 0,
    children,
  };

  if (status === "registered" && otherId) {
    base.spouse_from_church = "yes";
    base.internal_spouse_id = encodeLeaderValue(
      otherId,
      (otherType as "member" | "minister") || "member",
    );
  } else if (status === "external") {
    base.spouse_from_church = "no";
    base.external_spouse_name = family.external_spouse_name || undefined;
    base.external_spouse_phone = family.external_spouse_phone || undefined;
    base.external_spouse_church = family.external_spouse_church || undefined;
  } else if (status === "pending") {
    base.skip_spouse_info = true;
  }

  return base;
}

export async function upsertMemberFamily(
  memberId: string,
  values: FamilyFormValues,
): Promise<void> {
  const built = buildFamilyPayload(memberId, values);
  if (!built) return;

  const children = (built._children as ChildWritePayload[]) || [];
  delete built._children;

  const existing = await getFamilyByMember(memberId);
  if (existing?.id) {
    await updateFamily(existing.id, built);
    if (
      values.has_children ||
      (!values.skip_spouse_info &&
        values.marital_status === "married" &&
        children.length >= 0)
    ) {
      await syncChildren(existing.id, children, existing);
    }
  } else {
    if (values.skip_spouse_info && children.length === 0) {
      return;
    }
    const created = await createFamily(built);
    for (const child of children) {
      await addFamilyChild(created.id, child);
    }
  }
}
