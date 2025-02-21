import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { motion } from 'framer-motion';
import "react-datepicker/dist/react-datepicker.css";
import { addDays, setHours, setMinutes, isSameDay } from 'date-fns';

interface DateTimePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  availableDates?: Date[];
  className?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  onChange,
  minDate = new Date(),
  maxDate = addDays(new Date(), 30),
  availableDates,
  className = ''
}) => {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Available time slots (9 AM to 5 PM, hourly)
  const timeSlots = Array.from({ length: 9 }, (_, i) => {
    const hour = i + 9;
    return setMinutes(setHours(new Date(), hour), 0);
  });

  // Custom header component with animations
  const CustomHeader = ({
    date,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }: any) => (
    <div className="flex items-center justify-between px-2 py-2">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </motion.button>
      <h2 className="text-lg font-semibold">
        {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </h2>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
        className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>
    </div>
  );

  // Time slot selection component
  const TimeSlotSelector = () => {
    if (!selectedDate) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="mt-4 space-y-2"
      >
        <h3 className="text-sm font-medium text-gray-700 mb-2">Select Time</h3>
        <div className="grid grid-cols-3 gap-2">
          {timeSlots.map((time) => {
            const timeString = time.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
            });
            const isSelected = selectedTime === timeString;

            return (
              <motion.button
                key={timeString}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedTime(timeString);
                  const newDate = new Date(selectedDate);
                  newDate.setHours(time.getHours(), 0, 0);
                  onChange(newDate);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {timeString}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // Custom day rendering
  const renderDayContents = (day: number, date: Date) => {
    const isAvailable = !availableDates || availableDates.some(d => isSameDay(d, date));
    return (
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`w-8 h-8 flex items-center justify-center rounded-full
          ${!isAvailable ? 'text-gray-400 line-through' : ''}`}
      >
        {day}
      </motion.div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => {
          if (date) {
            onChange(date);
          }
        }}
        minDate={minDate}
        maxDate={maxDate}
        dateFormat="MMMM d, yyyy h:mm aa"
        calendarClassName="!bg-white !border-0 !shadow-xl !rounded-lg !p-4"
        wrapperClassName="w-full"
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        renderCustomHeader={CustomHeader}
        renderDayContents={renderDayContents}
        showPopperArrow={false}
        popperClassName="!w-full md:!w-auto"
        popperPlacement="bottom-start"
        calendarContainer={({ className, children }) => (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={className}
          >
            {children}
            <TimeSlotSelector />
          </motion.div>
        )}
      />
    </div>
  );
};

export default DateTimePicker;
