<?php

use App\Http\Controllers\Api\BlogPostController;
use App\Http\Controllers\Api\AbsenceController;
use App\Http\Controllers\Api\AdmissionController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlogPostController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\GradeController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MessageThreadController;
use App\Http\Controllers\Api\MetaController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PhotoController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\SetupController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Kalanso — configuration initiale, Google et accès contrôlés par rôle
|--------------------------------------------------------------------------
*/

Route::get('/health', fn () => response()->json(['status' => 'ok', 'time' => now()->toIso8601String()]));

Route::get('/setup/status', [SetupController::class, 'status'])->middleware('throttle:60,1');
Route::post('/setup', [SetupController::class, 'store'])->middleware('throttle:10,1');

Route::get('/auth/google/status', [GoogleAuthController::class, 'status'])->middleware('throttle:60,1');
Route::post('/auth/google/exchange', [GoogleAuthController::class, 'exchange'])->middleware('throttle:10,1');

/*
| Blog public : lecture des articles publiés (le site vitrine et la page
| Blog de l'institut). La gestion est réservée à la direction et au
| secrétariat (voir plus bas, sous auth:sanctum + rôle).
*/
Route::get('/blog/posts', [BlogPostController::class, 'index'])->middleware('throttle:60,1');
Route::get('/blog/posts/{slug}', [BlogPostController::class, 'show'])
    ->where('slug', '[a-z0-9][a-z0-9-]{0,179}')
    ->middleware('throttle:60,1');

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    /*
    | Accessible par tous les rôles connectés (direction, secrétariat,
    | comptable, enseignant et parent).
    */
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/me/avatar', [PhotoController::class, 'storeAvatar']);
    Route::post('/me/password', [AuthController::class, 'updatePassword']);

    /*
    | Messagerie : tous les comptes connectés (y compris parents).
    */
    Route::get('/threads', [MessageThreadController::class, 'index']);
    Route::get('/threads/{thread}', [MessageThreadController::class, 'show']);
    Route::post('/threads', [MessageThreadController::class, 'store']);
    Route::match(['put', 'patch'], '/threads/{thread}', [MessageThreadController::class, 'update']);
    Route::post('/threads/{thread}/messages', [MessageThreadController::class, 'storeMessage']);
    Route::post('/threads/{thread}/read', [MessageThreadController::class, 'markRead']);
    Route::delete('/threads/{thread}', [MessageThreadController::class, 'destroy']);

    /*
    | Parents : uniquement leurs enfants liés (404 sinon).
    */
    Route::middleware('role:parent')->prefix('parent')->group(function () {
        Route::get('/meta', [ParentController::class, 'meta']);
        Route::get('/children', [ParentController::class, 'children']);
        Route::get('/children/{student}', [ParentController::class, 'child']);
        Route::get('/children/{student}/report-card', [ParentController::class, 'reportCard']);
        Route::get('/children/{student}/absences', [ParentController::class, 'absences']);
        Route::get('/children/{student}/finances', [ParentController::class, 'finances']);
    });

    /*
    | Personnel (tous les rôles sauf parents) : écrans et données globaux,
    | notifications de l'établissement.
    */
    Route::middleware('role:direction,secretariat,comptable,enseignant')->group(function () {
        Route::delete('/photos/{photo}', [PhotoController::class, 'destroy']);

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

        Route::get('/timetable', [TimetableController::class, 'index']);
        Route::get('/timetable/{timetable}', [TimetableController::class, 'show']);

        Route::get('/grades', [GradeController::class, 'index']);
        Route::get('/grades/{grade}', [GradeController::class, 'show']);

        Route::get('/absences', [AbsenceController::class, 'index']);
        Route::get('/absences/{absence}', [AbsenceController::class, 'show']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
        Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

        /*
        | Finances : direction et comptabilité.
        */
        Route::middleware('role:direction,comptable')->group(function () {
            Route::get('/invoices', [InvoiceController::class, 'index']);
            Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
            Route::get('/payments', [PaymentController::class, 'index']);
            Route::get('/payments/{payment}', [PaymentController::class, 'show']);
            Route::get('/finance/summary', [FinanceController::class, 'summary']);
            Route::get('/references/fee-types', [ReferenceController::class, 'feeTypes']);

            Route::post('/invoices', [InvoiceController::class, 'store']);
            Route::match(['put', 'patch'], '/invoices/{invoice}', [InvoiceController::class, 'update']);
            Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy']);

            Route::post('/payments', [PaymentController::class, 'store']);
            Route::match(['put', 'patch'], '/payments/{payment}', [PaymentController::class, 'update']);
            Route::delete('/payments/{payment}', [PaymentController::class, 'destroy']);
        });

        /*
        | Admissions : direction et secrétariat.
        */
        Route::middleware('role:direction,secretariat')->group(function () {
            Route::get('/admissions/stats', [AdmissionController::class, 'stats']);
            Route::get('/admissions', [AdmissionController::class, 'index']);
            Route::get('/admissions/{admission}', [AdmissionController::class, 'show']);

            Route::post('/admissions', [AdmissionController::class, 'store']);
            Route::match(['put', 'patch'], '/admissions/{admission}', [AdmissionController::class, 'update']);
            Route::post('/admissions/{admission}/enroll', [AdmissionController::class, 'enroll']);
            Route::delete('/admissions/{admission}', [AdmissionController::class, 'destroy']);
        });

        /*
        | Scolarité, personnel, planning et référentiels : direction et secrétariat.
        */
        Route::middleware('role:direction,secretariat')->group(function () {
            /*
            | Blog : rédaction et mise en ligne (le site vitrine lit les
            | articles publiés via les routes publiques).
            */
            Route::get('/blog/admin/posts', [BlogPostController::class, 'adminIndex']);
            Route::post('/blog/admin/posts', [BlogPostController::class, 'store']);
            Route::match(['put', 'patch'], '/blog/admin/posts/{post}', [BlogPostController::class, 'update']);
            Route::delete('/blog/admin/posts/{post}', [BlogPostController::class, 'destroy']);
            Route::post('/blog/admin/posts/{post}/photo', [BlogPostController::class, 'photo']);

            Route::get('/staff', [StaffController::class, 'index']);
            Route::get('/staff/{staff}', [StaffController::class, 'show']);

            Route::get('/documents', [DocumentController::class, 'index']);
            Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
            Route::get('/documents/{document}', [DocumentController::class, 'show']);

            Route::get('/references/departments', [ReferenceController::class, 'departments']);
            Route::get('/references/academic-years', [ReferenceController::class, 'academicYears']);
            Route::get('/references/terms', [ReferenceController::class, 'terms']);

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

            Route::post('/documents', [DocumentController::class, 'store']);
            Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);

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

        /*
        | Assiduité : direction, secrétariat et enseignants.
        */
        Route::middleware('role:direction,secretariat,enseignant')->group(function () {
            Route::post('/absences', [AbsenceController::class, 'store']);
            Route::match(['put', 'patch'], '/absences/{absence}', [AbsenceController::class, 'update']);
            Route::post('/absences/{absence}/justify', [AbsenceController::class, 'justify']);
            Route::delete('/absences/{absence}', [AbsenceController::class, 'destroy']);
        });

        /*
        | Notes : direction et enseignants.
        */
        Route::middleware('role:direction,enseignant')->group(function () {
            Route::post('/grades', [GradeController::class, 'store']);
            Route::match(['put', 'patch'], '/grades/{grade}', [GradeController::class, 'update']);
            Route::delete('/grades/{grade}', [GradeController::class, 'destroy']);
        });

        /*
        | Établissement, comptes utilisateurs et journal : direction uniquement.
        */
        Route::middleware('role:direction')->group(function () {
            Route::get('/audit-logs', [AuditLogController::class, 'index']);
            Route::patch('/references/terms/{term}/lock', [ReferenceController::class, 'toggleLock']);

            Route::put('/school', [SchoolController::class, 'update']);
            Route::patch('/school', [SchoolController::class, 'update']);
            Route::post('/school/photo', [PhotoController::class, 'storeSchoolPhoto']);
            Route::post('/school/photos', [PhotoController::class, 'storeSchoolPhotos']);

            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::match(['put', 'patch'], '/users/{user}', [UserController::class, 'update']);
            Route::delete('/users/{user}', [UserController::class, 'destroy']);
        });
    });
});
