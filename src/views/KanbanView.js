import React, { useEffect, useMemo, useState } from 'react';
import Badge from '../components/Badge';
import TaskDetailView from '../components/TaskDetailView';
import useJira from '../hooks/useJira';
import { X, Loader2, Calendar } from 'lucide-react';

// --- dnd-kit imports ---
import {
  DndContext,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { parseDate } from '../utils/helpers';

// --- Custom collision detection: prefer droppable under pointer, else closest center ---
const customCollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0
    ? pointerCollisions
    : closestCenter(args);
};

// --- Skeleton placeholder for new card creation ---
const KanbanCardSkeleton = () => (
  <div className="relative border rounded-md p-3 bg-white shadow-sm animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
    <div className="flex space-x-2">
      <div className="h-5 bg-gray-200 rounded-full w-8" />
      <div className="h-5 bg-gray-200 rounded-full w-8" />
      <div className="h-5 bg-gray-200 rounded-full w-8" />
    </div>
  </div>
);

// --- Draggable TaskCard Component ---
const TaskCard = ({ task, onTaskClick, isUpdating }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { task } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isDone = useMemo(
    () => ['done', 'cancel', 'cancelled'].some(k => task.status?.toLowerCase().includes(k)),
    [task.status]
  );
  const dueDate = useMemo(() => parseDate(task.dueDate), [task.dueDate]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative border rounded-md p-3 cursor-pointer hover:bg-white transition-colors bg-white shadow-sm"
    >
      {isUpdating && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20 rounded-md">
          <Loader2 className="animate-spin text-blue-500" />
        </div>
      )}
      <div onClick={() => onTaskClick(task)}>
        <p className="text-sm font-medium text-gray-900 mb-2 break-words" title={task.title}>
          {task.title}
        </p>
        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <span>{task.id}</span>
          {!isDone && (
            <div className="flex items-center gap-1">
              <Badge type="timeliness" task={task} />
              <Badge type="priority" task={task} />
            </div>
          )}
        </div>
        {!isDone && dueDate && (
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <Calendar size={14} className="mr-1.5" />
            <span>
              Due: {dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- KanbanColumn: droppable & scrollable column ---
const KanbanColumn = ({ columnId, title, tasks = [], onTaskClick, updatingTaskId, isCreatingTask }) => {
  const { setNodeRef } = useDroppable({ id: columnId });
  const bg = useMemo(() => {
    const s = title.toLowerCase();
    if (s.includes('done')) return 'bg-green-100';
    if (s.includes('progress')) return 'bg-blue-100';
    if (s.includes('backlog') || s.includes('to do')) return 'bg-yellow-100';
    return 'bg-gray-100';
  }, [title]);
  const ids = useMemo(() => tasks.map(t => t.id), [tasks]);

  return (
    <div
      id={`column-${columnId}`}
      ref={setNodeRef}
      className="flex flex-col flex-1 min-h-0 bg-gray-100 rounded-lg shadow-inner"
    >
      <div className={`p-2 border-b-2 flex-shrink-0 ${bg}`}>        
        <h3 className="font-semibold text-gray-700 uppercase text-sm">
          {title} <span className="text-gray-500">({tasks.length + (columnId === 'To Do' && isCreatingTask ? 1 : 0)})</span>
        </h3>
      </div>
      <div className="p-2 flex-1 min-h-0 overflow-y-auto space-y-2">
        {columnId === 'To Do' && isCreatingTask && <KanbanCardSkeleton />}
        <SortableContext items={ids}>
          {tasks.map(t => (
            <TaskCard
              key={t.id}
              task={t}
              onTaskClick={onTaskClick}
              isUpdating={updatingTaskId === t.id}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

// --- TaskDetailViewDrawer: always rendered with slide animation ---
const TaskDetailViewDrawer = ({ task, onClose }) => {
  // Keep in DOM for transitions
  return (
    <div className={`fixed inset-0 z-50 transition-opacity ${task ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black transition-opacity ease-in-out duration-300 ${task ? 'bg-opacity-50' : 'bg-opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full bg-white w-full max-w-2xl shadow-xl transform transition-transform ease-in-out duration-300 flex flex-col ${
          task ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-end p-2 border-b">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {task && <TaskDetailView task={task} />}
        </div>
      </div>
    </div>
  );
};

// --- Main KanbanView Component ---
const KanbanView = ({ tasks, onUpdateStatus, updatingTaskId, isCreatingTask }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [cols, setCols] = useState({ Backlog: [], 'To Do': [], 'In Progress': [], Done: [] });

  const mapping = useMemo(
    () => ({
      Backlog: ['on hold', 'pending user review'],
      'To Do': ['open', 'to do', 'reopen'],
      'In Progress': ['in progress'],
      Done: ['done', 'cancelled', 'cancel'],
    }),
    []
  );

  useEffect(() => {
    if (!updatingTaskId) {
      const grouped = { Backlog: [], 'To Do': [], 'In Progress': [], Done: [] };
      tasks.forEach(t => {
        const s = t.status?.toLowerCase() || '';  
        const col = Object.keys(mapping).find(c => mapping[c].some(k => s.includes(k))) || 'Backlog';
        grouped[col].push(t);
      });
      setCols(grouped);
    }
  }, [tasks, mapping, updatingTaskId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findCol = id => Object.keys(cols).includes(id) ? id : Object.keys(cols).find(c => cols[c].some(t => t.id === id));

  const handleDragStart = ({ active }) => setActiveTask(tasks.find(t => t.id === active.id) || null);

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const from = findCol(active.id);
    const to = findCol(over.id);
    if (!from || !to || from === to) return;
    setCols(prev => {
      const next = { ...prev };
      const moving = next[from].find(t => t.id === active.id);
      next[from] = next[from].filter(t => t.id !== active.id);
      next[to] = [moving, ...next[to]];
      return next;
    });
    setTimeout(() => document.getElementById(`column-${to}`)?.scrollTo({ top: 0, behavior: 'smooth' }), 0);
    onUpdateStatus(active.id, to);
  };

  return (
    <div className="h-screen flex flex-col p-2">
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-2 flex-1 min-h-0">
          {Object.entries(cols).map(([col, arr]) => (
            <KanbanColumn
              key={col}
              columnId={col}
              title={col}
              tasks={arr}
              onTaskClick={setSelectedTask}
              updatingTaskId={updatingTaskId}
              isCreatingTask={isCreatingTask}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} onTaskClick={() => {}} isUpdating={false} />}
        </DragOverlay>
      </DndContext>

      {/* Drawer always mounted for slide animation */}
      <TaskDetailViewDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
};

export default KanbanView;
