import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Appointment {
  id: number;
  time: string;
  description: string;
  views: number;
  recurrence?: 'daily' | 'weekly' | 'monthly';
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    CommonModule,
    MatSelectModule
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  selectedDate: string | null = null;
  appointmentForm: FormGroup;
  isEditing: boolean = false;
  editingAppointmentId: number | null = null;
  view: 'monthly' | 'weekly' | 'daily' = 'monthly';
  searchTerm: string = '';

  daysOfWeek = ['Mon','Tue','Wed','Thur','Fri','Sat','Sun'];
  monthsOfYear =['January','February','March','April','May','June','July','August','September','October','Novembr','December'];
  calendarDates: (number | null)[] = [];
  appointments: { [key: string]: Appointment[] } = {};
  filteredAppointments: { [key: string]: Appointment[] } = {};

  constructor(private fb: FormBuilder) {
    this.appointmentForm = this.fb.group({
      time: ['', Validators.required],
      description: ['', Validators.required],
      recurrence: ['none']
    });
  }

  ngOnInit() {
    this.loadAppointments();
    this.loadCalendar();
    this.requestNotificationPermission();
  }

  requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
        } else {
          console.log('Notification permission denied.');
        }
      });
    } else {
      console.log('Browser does not support notifications.');
    }
  }

  setView(view: 'monthly' | 'weekly' | 'daily') {
    this.view = view;
    this.loadCalendar();
  }

  loadCalendar() {
    if (this.view === 'monthly') {
      this.loadMonthlyCalendar();
    } else if (this.view === 'weekly') {
      this.loadWeeklyCalendar();
    } else {
      this.loadDailyCalendar();
    }
  }

  loadMonthlyCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    this.calendarDates = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  }

  loadWeeklyCalendar() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);

    this.calendarDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date.getDate();
    });
  }

  loadDailyCalendar() {
    this.calendarDates = [new Date().getDate()];
  }

  selectDate(date: number | null) {
    if (date !== null) {
      this.selectedDate = `${this.currentYear}-${this.currentMonth + 1}-${date}`;
    } else {
      this.selectedDate = null;
    }
  }

  addAppointment() {
    if (this.selectedDate && this.appointmentForm.valid) {
      const { time, description, recurrence } = this.appointmentForm.value;
      const id = this.isEditing ? this.editingAppointmentId! : new Date().getTime();
      const formattedTime = this.formatTime(time);
      
      if (!this.appointments[this.selectedDate]) {
        this.appointments[this.selectedDate] = [];
      }
      
      if (this.isEditing) {
        this.appointments[this.selectedDate] = this.appointments[this.selectedDate].map(appointment => 
          appointment.id === id ? { id, time: formattedTime, description, views: appointment.views, recurrence } : appointment
        );
        this.isEditing = false;
        this.editingAppointmentId = null;
      } else {
        this.appointments[this.selectedDate].push({ id, time: formattedTime, description, views: 0, recurrence });
      }
      this.saveAppointments();
      this.scheduleNotification(this.selectedDate, time, description);
      this.scheduleRecurringAppointments(id, formattedTime, description, recurrence);
      this.appointmentForm.reset();
    }
  }

  editAppointment(date: string, id: number) {
    const appointment = this.appointments[date].find(appt => appt.id === id);
    if (appointment) {
      this.appointmentForm.setValue({
        time: appointment.time,
        description: appointment.description,
        recurrence: appointment.recurrence || 'none'
      });
      this.isEditing = true;
      this.editingAppointmentId = id;
    }
  }

  incrementViews(date: string, id: number) {
    const appointment = this.appointments[date].find(appt => appt.id === id);
    if (appointment) {
      appointment.views++;
      this.saveAppointments();
    }
  }

  formatTime(time: string): string {
    return time;
  }

  deleteAppointment(date: string, id: number) {
    if (this.appointments[date]) {
      this.appointments[date] = this.appointments[date].filter(appointment => appointment.id !== id);
      this.saveAppointments();
    }
  }

  moveAppointment(date: string, id: number, time: string) {
    
  }

  getAppointmentsForDate(date: string) {
    if (this.searchTerm) {
      return this.appointments[date]?.filter(appointment => 
        appointment.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      ) || [];
    }
    return this.appointments[date] || [];
  }

  loadAppointments() {
    const storedAppointments = localStorage.getItem('appointments');
    if (storedAppointments) {
      this.appointments = JSON.parse(storedAppointments);
    }
  }

  saveAppointments() {
    localStorage.setItem('appointments', JSON.stringify(this.appointments));
  }

  scheduleNotification(date: string, time: string, description: string) {
    const appointmentTime = new Date(`${date}T${time}`);
    const now = new Date();
    const notificationTime = new Date(appointmentTime.getTime() - 10 * 60 * 1000);

    if (notificationTime > now) {
      const delay = notificationTime.getTime() - now.getTime();
      setTimeout(() => {
        this.showNotification(description);
      }, delay);
    }
  }

  showNotification(description: string) {
    if (Notification.permission === 'granted') {
      new Notification('Appointment Reminder', {
        body: `You have an appointment: ${description} in 10 minutes.`,
      });
    }
  }

  searchAppointments() {
    this.filteredAppointments = {};
    for (const date in this.appointments) {
      const filtered = this.appointments[date].filter(appointment =>
        appointment.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        this.filteredAppointments[date] = filtered;
      }
    }
  }

  scheduleRecurringAppointments(id: number, time: string, description: string, recurrence: 'daily' | 'weekly' | 'monthly') {
    if (recurrence && recurrence !== 'none') {
      const currentDate = new Date(this.selectedDate!);
      let nextDate = new Date(currentDate);

      for (let i = 0; i < 12; i++) {
        switch (recurrence) {
          case 'daily':
            nextDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            nextDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(currentDate.getMonth() + 1);
            break;
        }

        const formattedDate = `${nextDate.getFullYear()}-${nextDate.getMonth() + 1}-${nextDate.getDate()}`;
        if (!this.appointments[formattedDate]) {
          this.appointments[formattedDate] = [];
        }
        this.appointments[formattedDate].push({ id, time, description, views: 0, recurrence });
      }
      this.saveAppointments();
    }
  }

  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.loadCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.loadCalendar();
  }

  getDatesForCurrentView(): string[] {
    return this.calendarDates.filter(date => date !== null).map(date => `${this.currentYear}-${this.currentMonth + 1}-${date}`);
  }
}
