<?php

namespace Database\Seeders;

use App\Models\Absence;
use App\Models\AcademicYear;
use App\Models\ClassSubject;
use App\Models\Grade;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Term;
use App\Models\TimetableSlot;
use Illuminate\Database\Seeder;

class AcademicSeeder extends Seeder
{
    public function run(): void
    {
        $year = AcademicYear::current()->firstOrFail();
        $term = Term::current()->firstOrFail();
        $classes = SchoolClass::with('headTeacher')->orderBy('id')->get();
        $subjects = Subject::orderBy('id')->get()->keyBy('code');
        $staff = Staff::all()->keyBy('email');

        $teacherByCode = [
            'MATH' => 'm.martior@diallo.test',
            'PHY' => 's.hilorma@diallo.test',
            'SVT' => 'b.framiena@diallo.test',
            'FRA' => 'm.diallo@diallo.test',
            'PHI' => 'm.diallo@diallo.test',
            'HGE' => 'a.traore@diallo.test',
            'ANG' => 'k.sow@diallo.test',
            'ARA' => 'm.diallo@diallo.test',
            'ESP' => 'k.sow@diallo.test',
            'INF' => 'm.martior@diallo.test',
            'ECO' => 'a.traore@diallo.test',
            'EPS' => 'r.rifa@diallo.test',
            'ART' => 'm.diallo@diallo.test',
            'MUS' => 'm.diallo@diallo.test',
        ];

        foreach ($classes as $class) {
            foreach ($subjects as $code => $subject) {
                ClassSubject::updateOrCreate(
                    ['school_class_id' => $class->id, 'subject_id' => $subject->id, 'academic_year_id' => $year->id],
                    ['staff_id' => $staff[$teacherByCode[$code]]?->id, 'weekly_hours' => $subject->weekly_hours]
                );
            }
        }

        $slots = [
            ['08:00:00', '10:00:00'],
            ['10:00:00', '12:00:00'],
            ['14:00:00', '16:00:00'],
        ];
        $rotation = ['MATH', 'FRA', 'PHY', 'ANG', 'HGE', 'SVT', 'EPS', 'INF'];
        foreach ($classes as $ci => $class) {
            $n = 0;
            foreach (range(1, 5) as $day) {
                foreach ($slots as [$start, $end]) {
                    $code = $rotation[($n + $ci) % count($rotation)];
                    $subject = $subjects[$code];
                    TimetableSlot::updateOrCreate(
                        ['school_class_id' => $class->id, 'day_of_week' => $day, 'starts_at' => $start],
                        [
                            'subject_id' => $subject->id,
                            'staff_id' => $staff[$teacherByCode[$code]]?->id,
                            'term_id' => $term->id,
                            'ends_at' => $end,
                            'room' => $class->room,
                            'is_live' => $class->name === 'Terminale S' && $day === 4 && $start === '10:00:00',
                        ]
                    );
                    $n++;
                }
            }
        }

        $targets = [
            '2026-0142' => 12.8,
            '2026-0143' => 11.2,
            '2026-0151' => 14.6,
            '2026-0164' => 13.1,
            '2026-0177' => 15.4,
            '2026-0188' => 9.8,
        ];
        $core = ['MATH', 'PHY', 'FRA', 'ANG', 'HGE'];
        $students = Student::with('schoolClass')->get();
        foreach ($students as $student) {
            $base = $targets[$student->matricule] ?? fake()->randomFloat(1, 8, 17);
            foreach ($core as $code) {
                $subject = $subjects[$code];
                foreach ([
                    ['devoir_1', '2025-10-15', 0],
                    ['devoir_2', '2025-11-20', 0],
                    ['composition', '2025-12-15', 0],
                ] as [$evaluation, $date]) {
                    $score = max(0, min(20, round($base + fake()->randomFloat(1, -2.2, 2.2), 2)));
                    Grade::updateOrCreate(
                        ['student_id' => $student->id, 'subject_id' => $subject->id, 'term_id' => $term->id, 'evaluation' => $evaluation],
                        [
                            'school_class_id' => $student->school_class_id,
                            'score' => $score,
                            'max_score' => 20,
                            'coefficient' => $subject->coefficient,
                            'evaluated_on' => $date,
                        ]
                    );
                }
            }
        }

        $absenceRows = [
            ['2026-0142', '2025-10-23', false, null],
            ['2026-0143', '2025-10-26', true, 'Certificat médical'],
            ['2026-0151', '2026-01-17', true, 'Rendez-vous familial'],
            ['2026-0164', '2025-11-15', false, null],
            ['2026-0177', '2025-11-28', true, 'Transport'],
        ];
        foreach ($absenceRows as [$matricule, $date, $justified, $reason]) {
            $student = Student::where('matricule', $matricule)->first();
            if (! $student) {
                continue;
            }
            Absence::updateOrCreate(
                ['student_id' => $student->id, 'date' => $date],
                [
                    'school_class_id' => $student->school_class_id,
                    'term_id' => $term->id,
                    'starts_at' => '08:00:00',
                    'ends_at' => '12:00:00',
                    'reason' => $reason,
                    'is_justified' => $justified,
                    'justification' => $justified ? $reason : null,
                    'recorded_by' => $staff['o.sy@diallo.test']?->id,
                ]
            );
        }

        $others = Student::whereNotIn('matricule', array_column($absenceRows, 0))->inRandomOrder()->take(24)->get();
        foreach ($others as $student) {
            $date = fake()->dateTimeBetween('-90 days', 'now')->format('Y-m-d');
            Absence::updateOrCreate(
                ['student_id' => $student->id, 'date' => $date],
                [
                    'school_class_id' => $student->school_class_id,
                    'term_id' => $term->id,
                    'starts_at' => '08:00:00',
                    'ends_at' => '10:00:00',
                    'reason' => fake()->randomElement(['Maladie', 'Transport', 'Familial', null]),
                    'is_justified' => fake()->boolean(55),
                    'recorded_by' => $staff['o.sy@diallo.test']?->id,
                ]
            );
        }
    }
}
