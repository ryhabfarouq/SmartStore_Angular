import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../../core/services/user.service';
import { User, UserRole, UserStatus } from '../../../models/user.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class AdminUsers implements OnInit {
  private userService = inject(UserService);
  private toastr = inject(ToastrService);

  allUsers = signal<User[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');
  roleFilter = signal<UserRole | 'all'>('all');
  statusFilter = signal<UserStatus | 'all'>('all');
  actionLoadingId = signal<number | null>(null);

  filteredUsers = computed(() => {
    let users = this.allUsers();
    const term = this.searchTerm().toLowerCase();
    if (term) {
      users = users.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }
    if (this.roleFilter() !== 'all') {
      users = users.filter(u => u.role === this.roleFilter());
    }
    if (this.statusFilter() !== 'all') {
      users = users.filter(u => u.status === this.statusFilter());
    }
    return users;
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getAllUsers().subscribe({
      next: (users) => { this.allUsers.set(users); this.isLoading.set(false); },
      error: () => { this.toastr.error('Failed to load users'); this.isLoading.set(false); }
    });
  }

  approveUser(user: User): void {
    if (!confirm(`Approve ${user.name}?`)) return;
    this.actionLoadingId.set(user.id);
    this.userService.updateUserStatus(user.id, 'active').subscribe({
      next: (updated) => {
        this.allUsers.update(list => list.map(u => u.id === user.id ? { ...u, status: updated.status } : u));
        this.toastr.success(`${user.name} has been approved!`);
        this.actionLoadingId.set(null);
      },
      error: () => { this.toastr.error('Failed to approve user'); this.actionLoadingId.set(null); }
    });
  }

  restrictUser(user: User): void {
    if (!confirm(`Restrict ${user.name}? They will lose access.`)) return;
    this.actionLoadingId.set(user.id);
    this.userService.updateUserStatus(user.id, 'restricted').subscribe({
      next: (updated) => {
        this.allUsers.update(list => list.map(u => u.id === user.id ? { ...u, status: updated.status } : u));
        this.toastr.warning(`${user.name} has been restricted.`);
        this.actionLoadingId.set(null);
      },
      error: () => { this.toastr.error('Failed to restrict user'); this.actionLoadingId.set(null); }
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Permanently delete ${user.name}? This action cannot be undone.`)) return;
    this.actionLoadingId.set(user.id);
    this.userService.softDeleteUser(user.id).subscribe({
      next: () => {
        this.allUsers.update(list => list.map(u => u.id === user.id ? { ...u, status: 'deleted' } : u));
        this.toastr.info(`${user.name} has been deleted.`);
        this.actionLoadingId.set(null);
      },
      error: () => { this.toastr.error('Failed to delete user'); this.actionLoadingId.set(null); }
    });
  }

  getRoleBadgeClass(role: UserRole): string {
    const map: Record<UserRole, string> = {
      admin: 'badge-role-admin',
      seller: 'badge-role-seller',
      customer: 'badge-role-customer'
    };
    return map[role];
  }

  getStatusClass(status: UserStatus): string {
    const map: Record<UserStatus, string> = {
      active: 'status-active',
      pending: 'status-pending',
      restricted: 'status-restricted',
      deleted: 'status-deleted'
    };
    return map[status];
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onRoleFilter(event: Event): void {
    this.roleFilter.set((event.target as HTMLSelectElement).value as UserRole | 'all');
  }

  onStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as UserStatus | 'all');
  }
}
