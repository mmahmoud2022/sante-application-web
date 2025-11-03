/**
 * Doctor Comparison Component
 * Side-by-side comparison of multiple doctors
 */

'use client';

import React from 'react';
import { Star, MapPin, Clock, DollarSign, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialization?: string;
  rating?: number;
  location?: string;
  experience_years?: number;
  consultation_fee?: number;
  languages?: string[];
  availability?: string;
}

interface DoctorComparisonProps {
  doctors: Doctor[];
  onRemove?: (doctorId: number) => void;
  className?: string;
}

const ComparisonRow: React.FC<{
  label: string;
  icon: React.ReactNode;
  values: (string | number | undefined)[];
}> = ({ label, icon, values }) => (
  <div className="border-b border-gray-200 dark:border-gray-700">
    <div className="py-3 px-4 bg-gray-50 dark:bg-gray-800 flex items-center space-x-2">
      {icon}
      <span className="font-medium text-gray-900 dark:text-gray-100">{label}</span>
    </div>
    <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
      {values.map((value, index) => (
        <div key={index} className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
          {value || 'N/A'}
        </div>
      ))}
    </div>
  </div>
);

export const DoctorComparison: React.FC<DoctorComparisonProps> = ({
  doctors,
  onRemove,
  className,
}) => {
  if (doctors.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-gray-500 dark:text-gray-400">
          Select doctors to compare
        </p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="min-w-max bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Doctor headers */}
        <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700 border-b border-gray-200 dark:border-gray-700">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="relative p-4 text-center">
              {onRemove && (
                <button
                  onClick={() => onRemove(doctor.id)}
                  className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  aria-label="Remove doctor"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Dr. {doctor.first_name} {doctor.last_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {doctor.specialization}
              </p>
            </div>
          ))}
        </div>

        {/* Comparison rows */}
        <ComparisonRow
          label="Rating"
          icon={<Star className="h-4 w-4 text-yellow-500" />}
          values={doctors.map((d) => d.rating ? `${d.rating} ⭐` : undefined)}
        />

        <ComparisonRow
          label="Location"
          icon={<MapPin className="h-4 w-4 text-blue-500" />}
          values={doctors.map((d) => d.location)}
        />

        <ComparisonRow
          label="Experience"
          icon={<Clock className="h-4 w-4 text-green-500" />}
          values={doctors.map((d) => d.experience_years ? `${d.experience_years} years` : undefined)}
        />

        <ComparisonRow
          label="Consultation Fee"
          icon={<DollarSign className="h-4 w-4 text-purple-500" />}
          values={doctors.map((d) => d.consultation_fee ? `$${d.consultation_fee}` : undefined)}
        />

        <ComparisonRow
          label="Languages"
          icon={<span className="text-xs">🌐</span>}
          values={doctors.map((d) => d.languages?.join(', '))}
        />

        <ComparisonRow
          label="Availability"
          icon={<Clock className="h-4 w-4 text-gray-500" />}
          values={doctors.map((d) => d.availability)}
        />
      </div>
    </div>
  );
};

export default DoctorComparison;
