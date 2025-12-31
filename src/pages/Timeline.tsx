import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import BulkAddEventsModal from '../components/BulkAddEventsModal';
import { Plus, X, Save, Edit, Trash2, ArrowLeft, Upload, ZoomIn, ZoomOut, ChevronDown } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface TimelineEvent {
  id: string;
  event_id: string;
  time: string;
  end_time: string | null;
  title: string;
  description: string;
  location: string;
  color: string;
  order_index: number;
  event_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Event {
  id: string;
  event_name: string;
  event_date: string;
  end_date: string | null;
  multi_day_event: boolean;
}

export default function Timeline() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hourHeight, setHourHeight] = useState(200);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    time: '09:00',
    duration: 60,
    color: '#8B5CF6',
    event_date: '',
  });

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchTimelineEvents();
    }
  }, [selectedDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAddDropdown && !(event.target as Element).closest('.relative')) {
        setShowAddDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showAddDropdown]);

  const generateDateRange = (startDate: string, endDate: string | null): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(startDate);

    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const fetchEvent = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('id, event_name, event_date, end_date, multi_day_event')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching event:', error);
    } else if (data) {
      setEvent(data);
      const dates = generateDateRange(data.event_date, data.end_date);
      setAvailableDates(dates);
      setSelectedDate(dates[0]);
    }
  };

  const fetchTimelineEvents = async () => {
    if (!selectedDate) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('event_timeline')
      .select('*')
      .eq('event_id', id)
      .eq('event_date', selectedDate)
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching timeline events:', error);
    } else if (data) {
      setTimelineEvents(data);
    }
    setLoading(false);
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return endTotalMinutes - startTotalMinutes;
  };

  const handleAddEvent = async () => {
    if (!user || !id) return;

    const endTime = calculateEndTime(formData.time, formData.duration);
    const eventDate = formData.event_date || selectedDate;

    const { error } = await supabase.from('event_timeline').insert({
      event_id: id,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      time: formData.time,
      end_time: endTime,
      color: formData.color,
      created_by: user.id,
      event_date: eventDate,
    });

    if (error) {
      console.error('Error adding timeline event:', error);
      alert('Failed to add timeline event');
    } else {
      setShowAddModal(false);
      resetForm();
      fetchTimelineEvents();
    }
  };

  const handleBulkSave = async (events: Array<{ title: string; time: string; duration: number }>) => {
    if (!user || !id) return;

    const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6'];

    const insertPromises = events.map((event, index) => {
      const endTime = calculateEndTime(event.time, event.duration);
      const color = colors[index % colors.length];

      return supabase.from('event_timeline').insert({
        event_id: id,
        title: event.title,
        description: '',
        location: '',
        time: event.time,
        end_time: endTime,
        color: color,
        created_by: user.id,
        event_date: selectedDate,
      });
    });

    const results = await Promise.all(insertPromises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      console.error('Error adding some timeline events:', errors);
      alert(`Failed to add ${errors.length} out of ${events.length} events`);
    } else {
      fetchTimelineEvents();
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    const endTime = calculateEndTime(formData.time, formData.duration);
    const eventDate = formData.event_date || selectedDate;

    const { error } = await supabase
      .from('event_timeline')
      .update({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        time: formData.time,
        end_time: endTime,
        color: formData.color,
        event_date: eventDate,
      })
      .eq('id', editingEvent.id);

    if (error) {
      console.error('Error updating timeline event:', error);
      alert('Failed to update timeline event');
    } else {
      setEditingEvent(null);
      resetForm();
      fetchTimelineEvents();
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this timeline event?')) return;

    const { error } = await supabase
      .from('event_timeline')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting timeline event:', error);
      alert('Failed to delete timeline event');
    } else {
      fetchTimelineEvents();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      time: '09:00',
      duration: 60,
      color: '#8B5CF6',
      event_date: selectedDate,
    });
  };

  const startEdit = (timelineEvent: TimelineEvent) => {
    setEditingEvent(timelineEvent);
    const duration = timelineEvent.end_time
      ? calculateDuration(timelineEvent.time, timelineEvent.end_time)
      : 60;
    setFormData({
      title: timelineEvent.title,
      description: timelineEvent.description || '',
      location: timelineEvent.location || '',
      time: timelineEvent.time,
      duration,
      color: timelineEvent.color || '#8B5CF6',
      event_date: timelineEvent.event_date || selectedDate,
    });
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
      const period = i < 12 ? 'AM' : 'PM';
      slots.push({
        hour: i,
        label: `${hour} ${period}`,
        time: `${i.toString().padStart(2, '0')}:00`,
      });
    }
    return slots;
  };

  const formatTimeTo12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleZoomIn = () => {
    setHourHeight((prev) => Math.min(prev + 20, 400));
  };

  const handleZoomOut = () => {
    setHourHeight((prev) => Math.max(prev - 20, 80));
  };

  const getEventPosition = (startTime: string, endTime: string | null) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;

    let endMinutes = startMinutes + 60;
    if (endTime) {
      const [endHour, endMin] = endTime.split(':').map(Number);
      endMinutes = endHour * 60 + endMin;
    }

    const visualPaddingMinutes = 1;
    const visualStartMinutes = startMinutes + visualPaddingMinutes;
    const visualEndMinutes = endMinutes - visualPaddingMinutes;

    const top = (visualStartMinutes / 60) * hourHeight;
    const height = ((visualEndMinutes - visualStartMinutes) / 60) * hourHeight;

    return { top, height: Math.max(height, 40), startMinutes, endMinutes };
  };

  const eventsOverlap = (
    event1Start: number,
    event1End: number,
    event2Start: number,
    event2End: number
  ): boolean => {
    return event1Start < event2End && event2Start < event1End;
  };

  const calculateEventLayout = () => {
    const eventsWithPositions = timelineEvents.map((event) => {
      const position = getEventPosition(event.time, event.end_time);
      return { event, position };
    });

    const columns: Array<Array<typeof eventsWithPositions[0]>> = [];

    eventsWithPositions.forEach((eventData) => {
      let placed = false;

      for (let col = 0; col < columns.length; col++) {
        const column = columns[col];
        const hasOverlap = column.some((existingEvent) =>
          eventsOverlap(
            eventData.position.startMinutes,
            eventData.position.endMinutes,
            existingEvent.position.startMinutes,
            existingEvent.position.endMinutes
          )
        );

        if (!hasOverlap) {
          column.push(eventData);
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([eventData]);
      }
    });

    const eventLayouts = new Map();

    columns.forEach((column, colIndex) => {
      column.forEach((eventData) => {
        const overlappingColumnIndices: number[] = [];
        columns.forEach((col, idx) => {
          const hasOverlap = col.some((e) =>
            eventsOverlap(
              eventData.position.startMinutes,
              eventData.position.endMinutes,
              e.position.startMinutes,
              e.position.endMinutes
            )
          );
          if (hasOverlap) {
            overlappingColumnIndices.push(idx);
          }
        });

        const totalColumns = overlappingColumnIndices.length;
        const positionInOverlap = overlappingColumnIndices.indexOf(colIndex);
        const width = 100 / totalColumns;
        const left = (positionInOverlap * 100) / totalColumns;

        eventLayouts.set(eventData.event.id, {
          ...eventData.position,
          width,
          left,
        });
      });
    });

    return eventLayouts;
  };

  const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const clickedMinutes = (y / hourHeight) * 60;
    const clickedHour = Math.floor(clickedMinutes / 60);
    const clickedMin = Math.floor(clickedMinutes % 60);
    const roundedMin = Math.round(clickedMin / 15) * 15;

    const timeString = `${clickedHour.toString().padStart(2, '0')}:${roundedMin.toString().padStart(2, '0')}`;

    setFormData({
      ...formData,
      time: timeString,
      event_date: selectedDate,
    });
    setShowAddModal(true);
  };

  const parseTimeString = (timeStr: string): string | null => {
    const time12hr = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)/);
    if (time12hr) {
      let hours = parseInt(time12hr[1]);
      const minutes = time12hr[2] ? parseInt(time12hr[2]) : 0;
      const period = time12hr[3].toLowerCase();
      if (period === 'pm' && hours !== 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    const time24hr = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (time24hr) {
      const hours = parseInt(time24hr[1]);
      const minutes = parseInt(time24hr[2]);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }

    return null;
  };

  const parseTimelineFromText = (text: string): Array<{ title: string; time: string; endTime: string | null }> => {
    const events: Array<{ title: string; time: string; endTime: string | null }> = [];
    const lines = text.split('\n').filter(line => line.trim());

    const timeRangePattern = /(\d{1,2}:?\d{0,2}\s*(?:am|pm|AM|PM)?)\s*[-–to]+\s*(\d{1,2}:?\d{0,2}\s*(?:am|pm|AM|PM)?)\s*[:\-–]?\s*(.+)/;
    const singleTimePattern = /(\d{1,2}:?\d{0,2}\s*(?:am|pm|AM|PM)|\d{1,2}:\d{2})\s*[:\-–]?\s*(.+)/;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const rangeMatch = trimmedLine.match(timeRangePattern);
      if (rangeMatch) {
        const startTime = parseTimeString(rangeMatch[1]);
        const endTime = parseTimeString(rangeMatch[2]);
        const title = rangeMatch[3].trim();

        if (startTime && title) {
          events.push({ title, time: startTime, endTime });
        }
        continue;
      }

      const singleMatch = trimmedLine.match(singleTimePattern);
      if (singleMatch) {
        const time = parseTimeString(singleMatch[1]);
        const title = singleMatch[2].trim();

        if (time && title && title.length > 1) {
          events.push({ title, time, endTime: null });
        }
      }
    }

    return events;
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: unknown) => (item as { str: string }).str)
        .join(' ');
      text += pageText + '\n';
    }

    return text;
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase();
    const fileType = file.type;

    if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
      return extractTextFromPdf(file);
    }

    if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return extractTextFromDocx(file);
    }

    if (fileName.endsWith('.doc')) {
      throw new Error('Legacy .doc files are not supported. Please convert to .docx or .pdf');
    }

    if (fileName.endsWith('.pages')) {
      throw new Error('.pages files are not supported. Please export as .pdf or .docx from Pages');
    }

    return file.text();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !id) return;

    setUploading(true);
    console.log('Starting file upload:', file.name, file.type);

    try {
      console.log('Extracting text from file...');
      const fileText = await extractTextFromFile(file);
      console.log('Extracted text (first 500 chars):', fileText.substring(0, 500));

      console.log('Parsing timeline events...');
      const parsedEvents = parseTimelineFromText(fileText);
      console.log('Parsed events:', parsedEvents);

      if (parsedEvents.length === 0) {
        alert('No timeline events found. Please ensure your document has times in formats like "9:00 AM - Event Name" or "14:30 - Event Name"');
        return;
      }

      const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6'];

      for (let i = 0; i < parsedEvents.length; i++) {
        const event = parsedEvents[i];
        const endTime = event.endTime || calculateEndTime(event.time, 30);
        const color = colors[i % colors.length];

        await supabase.from('event_timeline').insert({
          event_id: id,
          title: event.title,
          description: '',
          location: '',
          time: event.time,
          end_time: endTime,
          color: color,
          created_by: user.id,
          event_date: selectedDate,
        });
      }

      alert(`Successfully imported ${parsedEvents.length} timeline events!`);
      fetchTimelineEvents();
    } catch (error) {
      console.error('Error uploading file:', error);
      const message = error instanceof Error ? error.message : 'Failed to parse timeline from file.';
      alert(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const eventLayouts = calculateEventLayout();

  const timeSlots = generateTimeSlots();

  const colorOptions = [
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#EF4444', label: 'Red' },
    { value: '#6366F1', label: 'Indigo' },
    { value: '#14B8A6', label: 'Teal' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-12">Loading timeline...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-0">
            <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
              <button
                onClick={() => navigate(`/dashboard/events/${id}`)}
                className="text-gray-400 hover:text-white transition flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
                  {event?.event_name || 'Event'} Timeline
                </h1>
                {event?.multi_day_event && availableDates.length > 1 ? (
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-sm text-gray-400">Day:</label>
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-1 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {availableDates.map((date, index) => (
                        <option key={date} value={date}>
                          Day {index + 1} - {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm mt-1">
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    }) : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto overflow-x-auto">
              <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1 flex-shrink-0">
                <button
                  onClick={handleZoomOut}
                  disabled={hourHeight <= 80}
                  className="p-1.5 sm:p-2 text-white rounded hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={hourHeight >= 400}
                  className="p-1.5 sm:p-2 text-white rounded hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.docx,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">{uploading ? 'Uploading...' : 'Upload Timeline'}</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="sm:hidden p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                title="Upload Timeline"
              >
                <Upload className="w-4 h-4" />
              </button>
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowAddDropdown(!showAddDropdown)}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Add</span>
                  <ChevronDown className="w-4 h-4 hidden sm:block" />
                </button>
                {showAddDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                    <button
                      onClick={() => {
                        setShowAddModal(true);
                        setShowAddDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition rounded-t-lg"
                    >
                      Add Individual Event
                    </button>
                    <button
                      onClick={() => {
                        setShowBulkAddModal(true);
                        setShowAddDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition rounded-b-lg"
                    >
                      Add Events in Bulk
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-900">
          <div className="relative">
            {timeSlots.map((slot) => (
              <div
                key={slot.hour}
                className="flex border-b border-gray-800"
                style={{ height: `${hourHeight}px` }}
              >
                <div className="w-12 sm:w-20 flex-shrink-0 pr-2 sm:pr-4 pt-2 text-right">
                  <span className="text-xs text-gray-500 font-medium">{slot.label}</span>
                </div>
                <div className="flex-1 relative border-l border-gray-800"></div>
              </div>
            ))}

            <div
              className="absolute top-0 left-12 sm:left-20 right-0 bottom-0 pointer-events-none"
              onDoubleClick={handleTimelineDoubleClick}
            >
              <div className="relative h-full pointer-events-auto">
                {timelineEvents.map((timelineEvent) => {
                  const layout = eventLayouts.get(timelineEvent.id);
                  if (!layout) return null;

                  const { top, height, width, left } = layout;
                  return (
                    <div
                      key={timelineEvent.id}
                      className="absolute rounded-lg cursor-pointer transition-all hover:shadow-lg hover:brightness-110 group overflow-hidden border-2"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `calc(${left}% + 4px)`,
                        width: `calc(${width}% - 8px)`,
                        backgroundColor: timelineEvent.color,
                        borderColor: 'rgba(0, 0, 0, 0.3)',
                        minHeight: '32px',
                      }}
                      onClick={() => startEdit(timelineEvent)}
                    >
                      <div className="px-2 py-1.5 h-full overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-semibold text-sm truncate">
                            {timelineEvent.title}
                          </h3>
                          <span className="text-white/70 text-xs whitespace-nowrap">
                            {formatTimeTo12Hour(timelineEvent.time)}
                            {timelineEvent.end_time && ` - ${formatTimeTo12Hour(timelineEvent.end_time)}`}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(timelineEvent.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        </div>
                        {timelineEvent.location && height > 45 && (
                          <p className="text-white/70 text-xs truncate mt-0.5">
                            {timelineEvent.location}
                          </p>
                        )}
                        {timelineEvent.description && height > 65 && (
                          <p className="text-white/60 text-xs mt-1 line-clamp-2">
                            {timelineEvent.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {(showAddModal || editingEvent) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingEvent ? 'Edit Timeline Event' : 'Add Timeline Event'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Ceremony"
                />
              </div>

              {event?.multi_day_event && availableDates.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Day *
                  </label>
                  <select
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {availableDates.map((date, index) => (
                      <option key={date} value={date}>
                        Day {index + 1} - {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Main Hall"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {formData.time && formData.duration && (
                <div className="text-sm text-gray-400">
                  {formatTimeTo12Hour(formData.time)} - {formatTimeTo12Hour(calculateEndTime(formData.time, formData.duration))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`h-10 rounded-lg border-2 transition ${
                        formData.color === color.value
                          ? 'border-white'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEvent(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={editingEvent ? handleUpdateEvent : handleAddEvent}
                disabled={!formData.title || !formData.time || !formData.duration}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {editingEvent ? 'Update' : 'Add'} Event
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkAddModal && (
        <BulkAddEventsModal
          onClose={() => setShowBulkAddModal(false)}
          onSave={handleBulkSave}
        />
      )}
    </DashboardLayout>
  );
}
