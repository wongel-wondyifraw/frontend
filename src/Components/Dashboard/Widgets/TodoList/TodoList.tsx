'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Empty, Spin, Tag } from 'antd';
import { message } from '@/lib/app-message';
import dayjs from 'dayjs';
import { completeTask, getMyTasks } from '@/services/api';
import type { TaskAssignment } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import './TodoList.css';

function personName(p?: { first_name?: string; middle_name?: string; last_name?: string } | null) {
  if (!p) return '';
  return `${p.first_name || ''} ${p.middle_name ? `${p.middle_name} ` : ''}${p.last_name || ''}`.trim();
}

const TodoList = () => {
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyTasks('all');
      setTasks(data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingCount = useMemo(
    () => tasks.filter((t) => t.status === 'pending').length,
    [tasks],
  );

  const handleComplete = async (task: TaskAssignment) => {
    if (task.status === 'completed') return;
    try {
      setCompletingId(task.id);
      const updated = await completeTask(task.id);
      message.success('Task marked completed');
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === task.id ? { ...t, ...updated, status: 'completed' as const } : t));
        return next.sort((a, b) => {
          if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
          return a.end_date.localeCompare(b.end_date);
        });
      });
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to complete task'));
    } finally {
      setCompletingId(null);
    }
  };

  const today = dayjs().format('YYYY-MM-DD');

  return (
    <div className="todo-list-card">
      <div className="todo-header">
        <h3>To-Do</h3>
        <span className="todo-count">{pendingCount}</span>
      </div>

      <div className="todo-items">
        {loading ? (
          <div className="todo-empty">
            <Spin />
          </div>
        ) : tasks.length === 0 ? (
          <div className="todo-empty">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tasks assigned" />
          </div>
        ) : (
          tasks.map((task) => {
            const done = task.status === 'completed';
            const overdue = !done && task.end_date < today;
            const visitName = task.target_member ? personName(task.target_member) : '';
            const label = visitName
              ? `${task.definition?.name || 'Task'}: visit ${visitName}`
              : (task.definition?.name || 'Task');

            return (
              <div
                key={task.id}
                className={`todo-item ${done ? 'completed' : ''} ${completingId === task.id ? 'completing' : ''}`}
              >
                <input
                  type="checkbox"
                  className="todo-checkbox"
                  checked={done}
                  disabled={done || completingId === task.id}
                  onChange={() => handleComplete(task)}
                  aria-label={done ? label : `Complete ${label}`}
                />
                <div className="todo-body">
                  <span className="todo-text">{label}</span>
                  <div className="todo-meta">
                    <span>
                      {dayjs(task.start_date).format('MMM D')} – {dayjs(task.end_date).format('MMM D, YYYY')}
                    </span>
                    {overdue && <Tag color="error">Overdue</Tag>}
                    {done && <Tag color="success">Done</Tag>}
                  </div>
                  {task.notes && <div className="todo-notes">{task.notes}</div>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TodoList;
