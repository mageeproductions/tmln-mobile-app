import { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';

interface BulkEvent {
  id: string;
  title: string;
  time: string;
  duration: number;
}

interface BulkAddEventsModalProps {
  onClose: () => void;
  onSave: (events: Array<{ title: string; time: string; duration: number }>) => Promise<void>;
}

export default function BulkAddEventsModal({ onClose, onSave }: BulkAddEventsModalProps) {
  const [events, setEvents] = useState<BulkEvent[]>([
    { id: crypto.randomUUID(), title: '', time: '09:00', duration: 60 },
  ]);
  const [saving, setSaving] = useState(false);

  const addRow = () => {
    const lastEvent = events[events.length - 1];
    const lastTime = lastEvent?.time || '09:00';
    const [hours, minutes] = lastTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (lastEvent?.duration || 60);
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    const newTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;

    setEvents([
      ...events,
      { id: crypto.randomUUID(), title: '', time: newTime, duration: 60 },
    ]);
  };

  const removeRow = (id: string) => {
    if (events.length === 1) return;
    setEvents(events.filter((e) => e.id !== id));
  };

  const updateEvent = (id: string, field: keyof BulkEvent, value: string | number) => {
    setEvents(events.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const handleSave = async () => {
    const validEvents = events.filter((e) => e.title.trim() && e.time && e.duration > 0);
    if (validEvents.length === 0) {
      alert('Please add at least one event with a title');
      return;
    }

    setSaving(true);
    try {
      await onSave(validEvents);
      onClose();
    } catch (error) {
      console.error('Error saving bulk events:', error);
      alert('Failed to save events');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl border border-gray-700 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Add Events in Bulk</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Add multiple events at once. Additional details can be added later.
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_140px_120px_40px] gap-3 text-sm font-medium text-gray-400 pb-2 border-b border-gray-700">
              <div>Event Name</div>
              <div>Start Time</div>
              <div>Duration (min)</div>
              <div></div>
            </div>

            {events.map((event, index) => (
              <div
                key={event.id}
                className="grid grid-cols-[1fr_140px_120px_40px] gap-3 items-center"
              >
                <input
                  type="text"
                  value={event.title}
                  onChange={(e) => updateEvent(event.id, 'title', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={`Event ${index + 1}`}
                />
                <input
                  type="time"
                  value={event.time}
                  onChange={(e) => updateEvent(event.id, 'time', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={event.duration}
                  onChange={(e) => updateEvent(event.id, 'duration', parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => removeRow(event.id)}
                  disabled={events.length === 1}
                  className="p-2 text-gray-400 hover:text-red-400 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove row"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addRow}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
          >
            <Plus className="w-4 h-4" />
            Add Another Event
          </button>
        </div>

        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || events.every((e) => !e.title.trim())}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : `Save ${events.filter((e) => e.title.trim()).length} Events`}
          </button>
        </div>
      </div>
    </div>
  );
}
