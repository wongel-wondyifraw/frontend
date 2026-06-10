'use client';
import React, { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import './TodoList.css';

const TodoList = () => {
    const [todos, setTodos] = useState([
        { id: 1, text: 'Review weekly budget', completed: false },
        { id: 2, text: 'Call with church elders', completed: true },
        { id: 3, text: 'Prepare slides for Sunday', completed: false },
    ]);
    const [newItem, setNewItem] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const toggleTodo = (id: number) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        setTodos([...todos, { id: Date.now(), text: newItem, completed: false }]);
        setNewItem('');
        setIsAdding(false);
    };

    return (
        <div className="todo-list-card">
            <div className="todo-header">
                <h3>To-Do List</h3>
                <button className="add-todo-btn" onClick={() => setIsAdding(!isAdding)}>
                    <PlusOutlined />
                </button>
            </div>

            {isAdding && (
                <form className="add-todo-input-form" onSubmit={handleAdd}>
                    <input
                        type="text"
                        className="add-todo-input"
                        placeholder="Add new task..."
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        autoFocus
                    />
                </form>
            )}

            <div className="todo-items">
                {todos.map((todo) => (
                    <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                        <input
                            type="checkbox"
                            className="todo-checkbox"
                            checked={todo.completed}
                            onChange={() => toggleTodo(todo.id)}
                        />
                        <span className="todo-text">{todo.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TodoList;
