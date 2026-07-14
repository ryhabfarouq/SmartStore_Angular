import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      const status = err.status;
      let message = 'An unexpected error occurred.';

      if (status === 400) message = err.error?.message || 'Bad request.';
      else if (status === 401) {
        message = 'Unauthorized. Please log in.';
        router.navigate(['/auth/login']);
      } else if (status === 403) message = 'You do not have permission to perform this action.';
      else if (status === 404) message = 'The requested resource was not found.';
      else if (status === 500) message = 'Server error. Please try again later.';
      else if (status === 0) message = 'Could not connect to server. Is JSON Server running?';

      toastr.error(message, 'Error', { timeOut: 4000 });
      return throwError(() => err);
    }),
  );
};
