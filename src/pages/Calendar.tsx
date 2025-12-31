import DashboardLayout from '../components/DashboardLayout';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function Calendar() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
          <p className="text-gray-600">View all your events in calendar format</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Calendar View</h2>
            <p className="text-gray-600">Calendar view coming soon</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
