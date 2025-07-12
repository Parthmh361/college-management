import { create } from 'zustand';

interface TimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
  subject: {
    _id: string;
    name: string;
    code: string;
  };
  teacher: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  room: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'break';
}

interface TimetableEntry {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  timeSlots: TimeSlot[];
}

interface Section {
  sectionName: string;
  schedule: TimetableEntry[];
}

interface Timetable {
  _id: string;
  semester: number;
  department: string;
  academicYear: string;
  sections: Section[];
  isActive: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TimetableState {
  timetables: Timetable[];
  selectedTimetable: Timetable | null;
  selectedSection: string;
  loading: boolean;
  error: string | null;
  subjects: any[];
  teachers: any[];

  // Actions
  setTimetables: (timetables: Timetable[]) => void;
  addTimetable: (timetable: Timetable) => void;
  updateTimetable: (id: string, updates: Partial<Timetable>) => void;
  deleteTimetable: (id: string) => void;
  setSelectedTimetable: (timetable: Timetable | null) => void;
  setSelectedSection: (section: string) => void;
  setSubjects: (subjects: any[]) => void;
  setTeachers: (teachers: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useTimetableStore = create<TimetableState>((set, get) => ({
  timetables: [],
  selectedTimetable: null,
  selectedSection: 'A',
  loading: false,
  error: null,
  subjects: [],
  teachers: [],

  setTimetables: (timetables: Timetable[]) => {
    set({ timetables });
  },

  addTimetable: (timetable: Timetable) => {
    set((state) => ({
      timetables: [...state.timetables, timetable]
    }));
  },

  updateTimetable: (id: string, updates: Partial<Timetable>) => {
    set((state) => ({
      timetables: state.timetables.map(tt =>
        tt._id === id ? { ...tt, ...updates } : tt
      ),
      selectedTimetable: state.selectedTimetable?._id === id
        ? { ...state.selectedTimetable, ...updates }
        : state.selectedTimetable
    }));
  },

  deleteTimetable: (id: string) => {
    set((state) => ({
      timetables: state.timetables.filter(tt => tt._id !== id),
      selectedTimetable: state.selectedTimetable?._id === id ? null : state.selectedTimetable
    }));
  },

  setSelectedTimetable: (timetable: Timetable | null) => {
    set({ selectedTimetable: timetable });
  },

  setSelectedSection: (section: string) => {
    set({ selectedSection: section });
  },

  setSubjects: (subjects: any[]) => {
    set({ subjects });
  },

  setTeachers: (teachers: any[]) => {
    set({ teachers });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  }
}));

export type { Timetable, Section, TimetableEntry, TimeSlot };
