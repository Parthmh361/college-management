import { create } from 'zustand';

interface Department {
  _id: string;
  name: string;
  code: string;
  semesters: number[];
  sections: string[];
  students: any[];
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  department: string;
  semester: number;
  section: string;
  isActive: boolean;
}

interface AcademicState {
  departments: Department[];
  students: Student[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setDepartments: (departments: Department[]) => void;
  setStudents: (students: Student[]) => void;
  addDepartment: (department: Department) => void;
  addStudent: (student: Student) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAcademicStore = create<AcademicState>((set, get) => ({
  departments: [],
  students: [],
  loading: false,
  error: null,

  setDepartments: (departments: Department[]) => {
    set({ departments });
  },

  setStudents: (students: Student[]) => {
    set({ students });
  },

  addDepartment: (department: Department) => {
    set((state) => ({
      departments: [...state.departments, department]
    }));
  },

  addStudent: (student: Student) => {
    set((state) => ({
      students: [...state.students, student]
    }));
  },

  updateStudent: (id: string, updates: Partial<Student>) => {
    set((state) => ({
      students: state.students.map(student =>
        student._id === id ? { ...student, ...updates } : student
      )
    }));
  },

  deleteStudent: (id: string) => {
    set((state) => ({
      students: state.students.filter(student => student._id !== id)
    }));
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
