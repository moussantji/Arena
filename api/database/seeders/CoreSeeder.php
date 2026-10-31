<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Department;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Subject;
use App\Models\Term;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CoreSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'direction@diallo.test'],
            ['name' => 'M. Diallo', 'password' => Hash::make('password')]
        );

        School::updateOrCreate(['name' => 'DIALLO'], [
            'full_name' => 'École Internationale Diallo',
            'academic_year' => '2025 — 2026',
            'term' => 'Semestre 1',
            'currency' => 'FCFA',
            'address' => 'Hamdallaye ACI 2000, Bamako',
            'phone' => '+223 76 00 00 00',
            'email' => 'contact@diallo.test',
        ]);

        $year = AcademicYear::updateOrCreate(['label' => '2025-2026'], [
            'starts_on' => '2025-09-15',
            'ends_on' => '2026-06-30',
            'is_current' => true,
        ]);

        Term::updateOrCreate(['academic_year_id' => $year->id, 'name' => 'Semestre 1'], [
            'starts_on' => '2025-09-15',
            'ends_on' => '2026-01-31',
            'is_current' => true,
        ]);
        Term::updateOrCreate(['academic_year_id' => $year->id, 'name' => 'Semestre 2'], [
            'starts_on' => '2026-02-01',
            'ends_on' => '2026-06-30',
            'is_current' => false,
        ]);

        $departments = collect([
            ['name' => 'Sciences', 'code' => 'SCI'],
            ['name' => 'Lettres', 'code' => 'LET'],
            ['name' => 'Sciences humaines', 'code' => 'SHU'],
            ['name' => 'Langues', 'code' => 'LAN'],
            ['name' => 'Sport', 'code' => 'SPO'],
            ['name' => 'Arts', 'code' => 'ART'],
        ])->mapWithKeys(fn ($d) => [$d['code'] => Department::updateOrCreate(['code' => $d['code']], $d)]);

        $subjects = [
            ['Mathématiques', 'MATH', 'SCI', 42, 4],
            ['Physique-Chimie', 'PHY', 'SCI', 36, 3],
            ['SVT', 'SVT', 'SCI', 24, 2],
            ['Français', 'FRA', 'LET', 48, 4],
            ['Philosophie', 'PHI', 'LET', 18, 2],
            ['Histoire-Géo', 'HGE', 'SHU', 28, 2],
            ['Anglais', 'ANG', 'LAN', 32, 3],
            ['Arabe', 'ARA', 'LAN', 18, 2],
            ['Espagnol', 'ESP', 'LAN', 12, 2],
            ['Informatique', 'INF', 'SCI', 16, 2],
            ['Économie', 'ECO', 'SHU', 14, 2],
            ['EPS', 'EPS', 'SPO', 28, 1],
            ['Arts plastiques', 'ART', 'ART', 14, 1],
            ['Musique', 'MUS', 'ART', 8, 1],
        ];
        foreach ($subjects as [$name, $code, $dept, $hours, $coef]) {
            Subject::updateOrCreate(['code' => $code], [
                'name' => $name,
                'department_id' => $departments[$dept]->id,
                'weekly_hours' => $hours,
                'coefficient' => $coef,
                'is_active' => true,
            ]);
        }

        $staffData = [
            ['Moussa', 'Martior', 'Professeur de mathématiques', 'SCI', 12, 'm.martior@diallo.test'],
            ['Jean', 'Cissé', 'Censeur', 'SHU', 8, 'j.cisse@diallo.test'],
            ['Aminata', 'Barry', 'Comptable', 'SHU', 5, 'a.barry@diallo.test'],
            ['Oumar', 'Sy', 'Surveillant général', 'SHU', 3, 'o.sy@diallo.test'],
            ['Nafissatou', 'Bâ', 'Documentaliste', 'LET', 6, 'n.ba@diallo.test'],
            ['Kadidia', 'Sow', "Professeur d'anglais", 'LAN', 9, 'k.sow@diallo.test'],
            ['Mariam', 'Diallo', 'Professeure de français', 'LET', 11, 'm.diallo@diallo.test'],
            ['Souleymane', 'Hilorma', 'Professeur de physique-chimie', 'SCI', 7, 's.hilorma@diallo.test'],
            ['Awa', 'Traoré', "Professeure d'histoire-géographie", 'SHU', 10, 'a.traore@diallo.test'],
            ['Bakary', 'Framiéma', 'Professeur de SVT', 'SCI', 6, 'b.framiena@diallo.test'],
            ['Rokia', 'Rifa', "Professeure d'EPS", 'SPO', 4, 'r.rifa@diallo.test'],
        ];
        $staff = collect();
        foreach ($staffData as [$first, $last, $role, $dept, $years, $email]) {
            $staff->push(Staff::updateOrCreate(['email' => $email], [
                'first_name' => $first,
                'last_name' => $last,
                'role' => $role,
                'department_id' => $departments[$dept]->id,
                'years_experience' => $years,
                'phone' => '+223 76 00 00 '.str_pad((string) (10 + $staff->count()), 2, '0', STR_PAD_LEFT),
                'hired_on' => now()->subYears($years)->startOfYear()->toDateString(),
                'is_active' => true,
            ]));
        }

        $classes = [
            ['Terminale S', 'Terminale', 32, 35, 'S204', 'm.martior@diallo.test'],
            ['Terminale L', 'Terminale', 30, 35, 'S112', 'm.diallo@diallo.test'],
            ['Première S', 'Première', 34, 36, 'S201', 's.hilorma@diallo.test'],
            ['Première ES', 'Première', 29, 34, 'S105', 'a.traore@diallo.test'],
            ['Seconde A', 'Seconde', 33, 36, 'S301', 'b.framiena@diallo.test'],
            ['Seconde B', 'Seconde', 28, 34, 'S302', 'r.rifa@diallo.test'],
        ];
        foreach ($classes as [$name, $level, $effectif, $capacity, $room, $teacherEmail]) {
            SchoolClass::updateOrCreate(['academic_year_id' => $year->id, 'name' => $name], [
                'level' => $level,
                'capacity' => $capacity,
                'room' => $room,
                'head_teacher_id' => $staff->firstWhere('email', $teacherEmail)?->id,
                'is_active' => true,
            ]);
        }
    }
}
