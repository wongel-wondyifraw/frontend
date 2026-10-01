'use client';

import React, { useMemo } from 'react';
import { EnvironmentOutlined, GlobalOutlined } from '@ant-design/icons';
import {
  toGoogleMapsDirectionsUrl,
  toGoogleMapsEmbedUrl,
} from '@/lib/googleMapsEmbed';
import './LocationMap.css';

export type LocationMapProps = {
  title?: string;
  subtitle?: string;
  note?: string;
  mapUrl?: string | null;
  directionsUrl?: string | null;
};

const FALLBACK_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4180.505637180854!2d38.831462852903684!3d8.992677311552113!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b9b02753358f5%3A0xda146d8ce451d649!2zR29yby1TZWZlcmEgRnVsbCBHb3NwZWwgQ2h1cmNofCDhjI7hiK4t4Yiw4Y2I4YirIOGImeGIiSDhi4jhipXhjIzhiI0g4Ymk4YmwIOGKreGIreGIteGJsuGLq-GKlQ!5e0!3m2!1sen!2snl!4v1790682743448!5m2!1sen!2snl';

const FALLBACK_DIRECTIONS = 'https://www.google.com/maps?cid=15714397395026925129';

export default function LocationMap({
  title = 'Goro Full Gospel Church',
  subtitle = 'Bole Sub-City, Addis Ababa',
  note = 'Goro-Sefera Station (3 min walk)',
  mapUrl,
  directionsUrl,
}: LocationMapProps) {
  const embedSrc = useMemo(
    () => toGoogleMapsEmbedUrl(mapUrl) || FALLBACK_EMBED,
    [mapUrl],
  );
  const openHref = useMemo(
    () =>
      toGoogleMapsDirectionsUrl(directionsUrl, mapUrl) || FALLBACK_DIRECTIONS,
    [directionsUrl, mapUrl],
  );

  return (
    <div className="lp-location-card lp-location-card--map">
      <div className="lp-location-card-head">
        <h3>
          <EnvironmentOutlined />
          {title}
        </h3>
        {subtitle ? <span className="lp-location-card-sub">{subtitle}</span> : null}
      </div>

      <div className="lp-map-embed-frame">
        <iframe
          src={embedSrc}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          title={`${title} map`}
          className="lp-google-map-iframe"
        />
      </div>

      <div className="lp-location-footer">
        <span>{note ? `🚌 ${note}` : null}</span>
        <a
          className="lp-location-directions"
          href={openHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GlobalOutlined style={{ fontSize: 12 }} />
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}
