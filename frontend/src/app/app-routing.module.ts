import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { AdminComponent } from './admin/admin.component';
import { StudentComponent } from './student/student.component';
import { FacultyComponent } from './faculty/faculty.component';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './auth.guard';
import { HomeGuard } from './homeguard.guard';
const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [HomeGuard] },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    canDeactivate: [AuthGuard],
  },
  {
    path: 'faculty',
    component: FacultyComponent,
    canActivate: [AuthGuard],
    canDeactivate: [AuthGuard],
  },
  {
    path: 'student',
    component: StudentComponent,
    canActivate: [AuthGuard],
    canDeactivate: [AuthGuard],
  }, // Redirect to home component for all other paths
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
