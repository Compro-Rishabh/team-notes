import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, UserCheck, UserX, Edit2, Trash2 } from 'lucide-react';
import { useStore } from '@/store';
import { Modal } from './Modal';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { Member } from '@/types';

export function TeamManagement() {
  const { members, addMember, updateMember, deleteMember } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', active: true });

  const filteredMembers = members
    .filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      await updateMember({ ...editingMember, ...formData });
    } else {
      await addMember(formData);
    }
    setFormData({ name: '', email: '', active: true });
    setEditingMember(null);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({ name: member.name, email: member.email, active: member.active });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      await deleteMember(id);
    }
  };

  const handleToggleActive = async (member: Member) => {
    await updateMember({ ...member, active: !member.active });
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        icon={<Plus className="w-3.5 h-3.5" />}
        onClick={() => setIsOpen(true)}
      >
        Manage Team
      </Button>

      <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setEditingMember(null); }} title="Team Management">
        {/* Add/Edit Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            required
          />
          <Button type="submit" size="sm">
            {editingMember ? 'Update' : 'Add'}
          </Button>
          {editingMember && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setEditingMember(null); setFormData({ name: '', email: '', active: true }); }}
            >
              Cancel
            </Button>
          )}
        </form>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Members List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          <AnimatePresence>
            {filteredMembers.map((member) => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <Avatar name={member.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{member.name}</p>
                  <p className="text-xs text-slate-400 truncate">{member.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(member)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      member.active
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-slate-400 hover:bg-slate-50'
                    }`}
                    title={member.active ? 'Set inactive' : 'Set active'}
                  >
                    {member.active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No members found
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
