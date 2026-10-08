import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, ConfirmDialog } from './ui';
import type { TxType } from '../types';

export function CategoriesPage() {
  const { categories, transactions, addCategory, renameCategory, deleteCategory, toast } = useApp();
  const [name, setName] = useState('');
  const [type, setType] = useState<TxType>('expense');
  const [editing, setEditing] = useState<{ name: string; type: TxType } | null>(null);
  const [editName, setEditName] = useState('');
  const [deleting, setDeleting] = useState<{ name: string; type: TxType } | null>(null);

  const usageCount = (catName: string, catType: TxType) =>
    transactions.filter((t) => t.category === catName && t.type === catType).length;

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.name === trimmed && c.type === type)) {
      toast('Category already exists', 'error');
      return;
    }
    addCategory(trimmed, type);
    setName('');
    toast('Category added');
  };

  const submitRename = () => {
    if (!editing) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.name === trimmed && c.type === editing.type)) {
      toast('A category with this name already exists', 'error');
      return;
    }
    renameCategory(editing.name, editing.type, trimmed);
    setEditing(null);
    toast('Category renamed');
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const ok = deleteCategory(deleting.name, deleting.type);
    if (ok) {
      toast('Category deleted');
    } else {
      toast('Cannot delete: transactions are using this category', 'error');
    }
    setDeleting(null);
  };

  const expenseCats = categories.filter((c) => c.type === 'expense');
  const incomeCats = categories.filter((c) => c.type === 'income');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <h2 className="mb-4 font-semibold">Add Category</h2>
        <div className="flex flex-wrap gap-2">
          <input
            className="input flex-1"
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <select className="input !w-36" value={type} onChange={(e) => setType(e.target.value as TxType)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <button className="btn-primary" onClick={submit}>Add</button>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <CategoryList title="Expense Categories" cats={expenseCats} usageCount={usageCount}
          onEdit={(c) => { setEditing({ name: c.name, type: c.type }); setEditName(c.name); }}
          onDelete={(c) => setDeleting({ name: c.name, type: c.type })} />
        <CategoryList title="Income Categories" cats={incomeCats} usageCount={usageCount}
          onEdit={(c) => { setEditing({ name: c.name, type: c.type }); setEditName(c.name); }}
          onDelete={(c) => setDeleting({ name: c.name, type: c.type })} />
      </div>

      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div className="card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 font-semibold">Rename Category</h3>
            <input
              className="input mb-4"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitRename()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" onClick={submitRename}>Save</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete category?"
        message={deleting ? `Delete "${deleting.name}"? If transactions use it, deletion will be blocked.` : ''}
      />
    </div>
  );
}

function CategoryList({ title, cats, usageCount, onEdit, onDelete }: {
  title: string;
  cats: { name: string; type: TxType; custom?: boolean }[];
  usageCount: (name: string, type: TxType) => number;
  onEdit: (c: { name: string; type: TxType }) => void;
  onDelete: (c: { name: string; type: TxType }) => void;
}) {
  return (
    <Card>
      <h2 className="mb-3 font-semibold">{title}</h2>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {cats.map((c) => {
          const used = usageCount(c.name, c.type);
          return (
            <li key={c.name} className="flex items-center justify-between py-2">
              <span className="text-sm">
                {c.name}
                {c.custom && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">custom</span>}
                {used > 0 && <span className="ml-2 text-xs text-slate-400">({used} tx)</span>}
              </span>
              {c.custom && (
                <span className="flex gap-2 text-sm">
                  <button className="text-slate-400 hover:text-brand-600" title="Rename" onClick={() => onEdit(c)}>✏️</button>
                  <button className="text-slate-400 hover:text-red-600" title="Delete" onClick={() => onDelete(c)}>🗑</button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
