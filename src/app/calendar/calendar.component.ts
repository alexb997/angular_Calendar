import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Appointment {
  id: number;
  time: string;  
  description: string;
  views: number; 
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    CommonModule,
    MatInputModule
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent {
  
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  selectedDate: string | null = null;
  appointmentForm: FormGroup;
  isEditing: boolean = false;
  editingAppointmentId: number | null = null;
  view: 'monthly' | 'weekly' | 'daily' = 'monthly';
  daysOfWeek = ['Mon','Tue','Wed','Thur','Fri','Sat','Sun'];
  monthsOfYear =['January','February','March','April','May','June','July','August','September','October','Novembr','December'];
  calendarDates: (number | null)[] = [];
  appointments: { [key: string]: Appointment[] } = {};

  constructor(private fb: FormBuilder) {
    this.appointmentForm = this.fb.group({
      time: ['', Validators.required],
      description: ['', Validators.required]
    });
    this.loadCalendar();
  }

  loadCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    
    this.calendarDates = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
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
      const { time, description } = this.appointmentForm.value;
      const id = this.isEditing ? this.editingAppointmentId : new Date().getTime(); // Mock ID generation
      const formattedTime = this.formatTime(time);
      
      if (!this.appointments[this.selectedDate]) {
        this.appointments[this.selectedDate] = [];
      }
      
      if (this.isEditing) {
        this.appointments[this.selectedDate] = this.appointments[this.selectedDate].map(appointment => 
          appointment.id === id ? { id, time: formattedTime, description, views: appointment.views } : appointment
        );
        this.isEditing = false;
        this.editingAppointmentId = null;
      } else {
        this.appointments[this.selectedDate].push({ id, time: formattedTime, description, views: 0 });
      }
      this.saveAppointments();
      this.appointmentForm.reset();
    }
  }

  formatTime(time: string): string {
    return time; // No changes for 24-hour format
  }

  editAppointment(date: string, id: number) {
    const appointment = this.appointments[date].find(appt => appt.id === id);
    if (appointment) {
      this.appointmentForm.setValue({
        time: appointment.time,
        description: appointment.description
      });
      this.isEditing = true;
      this.editingAppointmentId = id;
    }
  }

  deleteAppointment(date: string, id: number) {
    if (this.appointments[date]) {
      this.appointments[date] = this.appointments[date].filter(appointment => appointment.id !== id);
    }
  }

  moveAppointment(date: string, appointmentId: number, newTime: string): void {
    const appointments = this.appointments[date];
    const appointmentToMove = appointments.find(app => app.id === appointmentId);
    
    if (appointmentToMove) {
      appointmentToMove.time = newTime;
    }
  }

  incrementViews(date: string, id: number) {
    const appointment = this.appointments[date].find(appt => appt.id === id);
    if (appointment) {
      appointment.views++;
      this.saveAppointments(); // Save to local storage
    }
  }

  getAppointmentsForDate(date: string) {
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
}