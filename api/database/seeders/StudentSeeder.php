<?php

namespace Database\Seeders;

use App\Models\Document;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $classes = SchoolClass::orderBy('id')->get();
        $byName = $classes->keyBy('name');
        $faker = fake('fr_FR');

        $named = [
            ['Aminata', 'Traoré', 'F', '2009-03-12', '2026-0142', 'Terminale S', 'a_jour', 'Mme Traoré', '+223 76 11 22 33'],
            ['Ibrahim', 'Konaté', 'M', '2009-07-04', '2026-0143', 'Terminale S', 'en_retard', 'M. Konaté', '+223 76 22 33 44'],
            ['Fatoumata', 'Diallo', 'F', '2010-01-19', '2026-0151', 'Première S', 'a_jour', 'Mme Diallo', '+223 76 33 44 55'],
            ['Moussa', 'Camara', 'M', '2010-11-02', '2026-0164', 'Seconde A', 'boursier', 'M. Camara', '+223 76 44 55 66'],
            ['Awa', 'Sow', 'F', '2009-05-23', '2026-0177', 'Terminale L', 'a_jour', 'M. Sow', '+223 76 55 66 77'],
            ['Seydou', 'Keïta', 'M', '2010-09-30', '2026-0188', 'Première ES', 'en_retard', 'Mme Keïta', '+223 76 66 77 88'],
        ];

        foreach ($named as $i => [$first, $last, $gender, $birth, $matricule, $className, $status, $guardian, $phone]) {
            $student = Student::updateOrCreate(['matricule' => $matricule], [
                'school_class_id' => $byName[$className]->id,
                'first_name' => $first,
                'last_name' => $last,
                'gender' => $gender,
                'birth_date' => $birth,
                'email' => mb_strtolower($first).'.'.mb_strtolower(str_replace(['é', 'è', 'ï', ' '], ['e', 'e', 'i', ''], $last)).'@eleve.diallo.test',
                'phone' => $phone,
                'address' => 'Hamdallaye ACI 2000, Bamako',
                'guardian_name' => $guardian,
                'guardian_phone' => $phone,
                'guardian_email' => 'parent'.($i + 1).'@famille.ml',
                'status' => $status,
                'enrolled_on' => '2025-09-15',
                'is_active' => true,
            ]);

            foreach ([
                ['Bulletin trimestre 1', 'pdf', 245760],
                ['Certificat de scolarité', 'pdf', 122880],
                ['Attestation de paiement', 'pdf', 98304],
            ] as $doc) {
                $path = 'documents/'.$student->matricule.'/'.str()->slug($doc[0]).'.pdf';
                $pdf = $this->demoPdf($doc[0], $first.' '.$last, $student->matricule);
                Storage::disk('public')->put($path, $pdf);

                Document::updateOrCreate(
                    ['student_id' => $student->id, 'name' => $doc[0]],
                    ['type' => $doc[1], 'file_path' => $path, 'size_bytes' => strlen($pdf), 'issued_on' => '2026-02-28']
                );
            }
        }

        $sequence = 200;
        for ($i = 0; $i < 180; $i++) {
            $class = $classes[$i % $classes->count()];
            $first = $faker->firstName();
            $last = $faker->lastName();
            $gender = $faker->randomElement(['M', 'F']);
            $status = $faker->randomElement(array_merge(
                array_fill(0, 15, 'a_jour'),
                array_fill(0, 4, 'en_retard'),
                ['boursier']
            ));
            $matricule = '2026-'.str_pad((string) ($sequence + $i), 4, '0', STR_PAD_LEFT);
            Student::updateOrCreate(['matricule' => $matricule], [
                'school_class_id' => $class->id,
                'first_name' => $first,
                'last_name' => $last,
                'gender' => $gender,
                'birth_date' => $faker->dateTimeBetween('2007-01-01', '2011-12-31')->format('Y-m-d'),
                'email' => mb_strtolower($first.'.'.$last.'.'.$i).'@eleve.diallo.test',
                'phone' => '+223 7'.random_int(0, 9).' '.random_int(10, 99).' '.random_int(10, 99).' '.random_int(10, 99),
                'address' => $faker->randomElement(['Hamdallaye ACI 2000', 'Badalabougou', 'Faladié', 'Sotuba', 'Kalaban Coura']).', Bamako',
                'guardian_name' => $faker->name(),
                'guardian_phone' => '+223 7'.random_int(0, 9).' '.random_int(10, 99).' '.random_int(10, 99).' '.random_int(10, 99),
                'guardian_email' => 'parent.'.($i + 1).'@famille.ml',
                'status' => $status,
                'enrolled_on' => '2025-09-15',
                'is_active' => true,
            ]);
        }
    }

    private function demoPdf(string $title, string $student, string $matricule): string
    {
        $escape = fn (string $value) => str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $value);
        $content = implode("\n", [
            'BT',
            '/F1 18 Tf',
            '60 770 Td',
            '(DIALLO - Ecole Internationale Diallo) Tj',
            '0 -30 Td',
            '/F1 13 Tf',
            '('.$escape(str()->ascii($title)).') Tj',
            '0 -24 Td',
            '('.$escape(str()->ascii($student)).' - '.$escape($matricule).') Tj',
            '0 -24 Td',
            '(Document de demonstration genere par l API.) Tj',
            'ET',
        ]);

        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
            '<< /Length '.strlen($content)." >>\nstream\n".$content."\nendstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $index => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($index + 1)." 0 obj\n".$object."\nendobj\n";
        }

        $xref = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }
        $pdf .= "trailer\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF\n";

        return $pdf;
    }
}
