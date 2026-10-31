<?php

use App\Http\Controllers\Api\AbsenceController;
use App\Http\Controllers\Api\AdmissionController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\GradeController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MessageThreadController;
use App\Http\Controllers\Api\MetaController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PhotoController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TimetableController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API DIALLO — lecture publique, écritures protégées par Sanctum
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::get('/school', [SchoolController::class, 'show']);
Route::get('/dashboard', DashboardController::class);
Route::get('/meta', MetaController::class);

Route::get('/students', [StudentController::class, 'index']);
Route::get('/students/{student}/report-card', [GradeController::class, 'reportCard']);
Route::get('/students/{student}', [StudentController::class, 'show']);

Route::get('/classes', [SchoolClassController::class, 'index']);
Route::get('/classes/{class}', [SchoolClassController::class, 'show']);

Route::get('/subjects', [SubjectController::class, 'index']);
Route::get('/subjects/{subject}', [SubjectController::class, 'show']);

Route::get('/staff', [StaffController::class, 'index']);
Route::get('/staff/{staff}', [StaffController::class, 'show']);

Route::get('/timetable', [TimetableController::class, 'index']);
Route::get('/timetable/{timetable}', [TimetableController::class, 'show']);

Route::get('/grades', [GradeController::class, 'index']);
Route::get('/grades/{grade}', [GradeController::class, 'show']);

Route::get('/absences', [AbsenceController::class, 'index']);
Route::get('/absences/{absence}', [AbsenceController::class, 'show']);

Route::get('/invoices', [InvoiceController::class, 'index']);
Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);

Route::get('/payments', [PaymentController::class, 'index']);
Route::get('/payments/{payment}', [PaymentController::class, 'show']);

Route::get('/finance/summary', [FinanceController::class, 'summary']);

Route::get('/admissions/stats', [AdmissionController::class, 'stats']);
Route::get('/admissions', [AdmissionController::class, 'index']);
Route::get('/admissions/{admission}', [AdmissionController::class, 'show']);

Route::get('/documents', [DocumentController::class, 'index']);
Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
Route::get('/documents/{document}', [DocumentController::class, 'show']);

Route::get('/threads', [MessageThreadController::class, 'index']);
Route::get('/threads/{thread}', [MessageThreadController::class, 'show']);

Route::get('/notifications', [NotificationController::class, 'index']);

Route::get('/references/departments', [ReferenceController::class, 'departments']);
Route::get('/references/fee-types', [ReferenceController::class, 'feeTypes']);
Route::get('/references/academic-years', [ReferenceController::class, 'academicYears']);
Route::get('/references/terms', [ReferenceController::class, 'terms']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/me/avatar', [PhotoController::class, 'storeAvatar']);

    Route::delete('/photos/{photo}', [PhotoController::class, 'destroy']);

    Route::put('/school', [SchoolController::class, 'update']);
    Route::patch('/school', [SchoolController::class, 'update']);
    Route::post('/school/photo', [PhotoController::class, 'storeSchoolPhoto']);
    Route::post('/school/photos', [PhotoController::class, 'storeSchoolPhotos']);

    Route::post('/students', [StudentController::class, 'store']);
    Route::match(['put', 'patch'], '/students/{student}', [StudentController::class, 'update']);
    Route::delete('/students/{student}', [StudentController::class, 'destroy']);
    Route::post('/students/{student}/photo', [PhotoController::class, 'storeStudentPhoto']);
    Route::post('/students/{student}/photos', [PhotoController::class, 'storeStudentPhotos']);

    Route::post('/classes', [SchoolClassController::class, 'store']);
    Route::match(['put', 'patch'], '/classes/{class}', [SchoolClassController::class, 'update']);
    Route::delete('/classes/{class}', [SchoolClassController::class, 'destroy']);

    Route::post('/subjects', [SubjectController::class, 'store']);
    Route::match(['put', 'patch'], '/subjects/{subject}', [SubjectController::class, 'update']);
    Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy']);

    Route::post('/staff', [StaffController::class, 'store']);
    Route::match(['put', 'patch'], '/staff/{staff}', [StaffController::class, 'update']);
    Route::delete('/staff/{staff}', [StaffController::class, 'destroy']);
    Route::post('/staff/{staff}/photo', [PhotoController::class, 'storeStaffPhoto']);
    Route::post('/staff/{staff}/photos', [PhotoController::class, 'storeStaffPhotos']);

    Route::post('/timetable', [TimetableController::class, 'store']);
    Route::match(['put', 'patch'], '/timetable/{timetable}', [TimetableController::class, 'update']);
    Route::delete('/timetable/{timetable}', [TimetableController::class, 'destroy']);

    Route::post('/grades', [GradeController::class, 'store']);
    Route::match(['put', 'patch'], '/grades/{grade}', [GradeController::class, 'update']);
    Route::delete('/grades/{grade}', [GradeController::class, 'destroy']);

    Route::post('/absences', [AbsenceController::class, 'store']);
    Route::match(['put', 'patch'], '/absences/{absence}', [AbsenceController::class, 'update']);
    Route::post('/absences/{absence}/justify', [AbsenceController::class, 'justify']);
    Route::delete('/absences/{absence}', [AbsenceController::class, 'destroy']);

    Route::post('/invoices', [InvoiceController::class, 'store']);
    Route::match(['put', 'patch'], '/invoices/{invoice}', [InvoiceController::class, 'update']);
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy']);

    Route::post('/payments', [PaymentController::class, 'store']);
    Route::match(['put', 'patch'], '/payments/{payment}', [PaymentController::class, 'update']);
    Route::delete('/payments/{payment}', [PaymentController::class, 'destroy']);

    Route::post('/admissions', [AdmissionController::class, 'store']);
    Route::match(['put', 'patch'], '/admissions/{admission}', [AdmissionController::class, 'update']);
    Route::post('/admissions/{admission}/enroll', [AdmissionController::class, 'enroll']);
    Route::delete('/admissions/{admission}', [AdmissionController::class, 'destroy']);

    Route::post('/documents', [DocumentController::class, 'store']);
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);

    Route::post('/threads', [MessageThreadController::class, 'store']);
    Route::match(['put', 'patch'], '/threads/{thread}', [MessageThreadController::class, 'update']);
    Route::post('/threads/{thread}/messages', [MessageThreadController::class, 'storeMessage']);
    Route::post('/threads/{thread}/read', [MessageThreadController::class, 'markRead']);
    Route::delete('/threads/{thread}', [MessageThreadController::class, 'destroy']);

    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    Route::post('/references/departments', [ReferenceController::class, 'storeDepartment']);
    Route::match(['put', 'patch'], '/references/departments/{department}', [ReferenceController::class, 'updateDepartment']);
    Route::delete('/references/departments/{department}', [ReferenceController::class, 'destroyDepartment']);

    Route::post('/references/fee-types', [ReferenceController::class, 'storeFeeType']);
    Route::match(['put', 'patch'], '/references/fee-types/{feeType}', [ReferenceController::class, 'updateFeeType']);
    Route::delete('/references/fee-types/{feeType}', [ReferenceController::class, 'destroyFeeType']);

    Route::post('/references/academic-years', [ReferenceController::class, 'storeAcademicYear']);
    Route::match(['put', 'patch'], '/references/academic-years/{academicYear}', [ReferenceController::class, 'updateAcademicYear']);
    Route::delete('/references/academic-years/{academicYear}', [ReferenceController::class, 'destroyAcademicYear']);
    Route::post('/references/terms', [ReferenceController::class, 'storeTerm']);
    Route::match(['put', 'patch'], '/references/terms/{term}', [ReferenceController::class, 'updateTerm']);
    Route::delete('/references/terms/{term}', [ReferenceController::class, 'destroyTerm']);
});

Route::get('/health', fn () => response()->json(['status' => 'ok', 'time' => now()->toIso8601String()]));
