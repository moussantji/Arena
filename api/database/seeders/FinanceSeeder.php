<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\FeeType;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Student;
use App\Models\Term;
use Illuminate\Database\Seeder;

class FinanceSeeder extends Seeder
{
    public function run(): void
    {
        $year = AcademicYear::current()->firstOrFail();
        $term = Term::current()->firstOrFail();

        $fees = [
            ['Frais de scolarité', 'SCOL', 350000, false],
            ['Cantine', 'CANT', 47000, true],
            ['Transport', 'TRAN', 20000, true],
            ['Inscription', 'INSC', 50000, false],
            ['Uniforme', 'UNIF', 25000, false],
        ];
        $feeTypes = collect();
        foreach ($fees as [$name, $code, $amount, $recurring]) {
            $feeTypes->put($code, FeeType::updateOrCreate(['code' => $code], [
                'name' => $name,
                'default_amount' => $amount,
                'is_recurring' => $recurring,
                'is_active' => true,
            ]));
        }

        $paidDates = [];
        foreach (Student::all() as $student) {
            $status = match ($student->status) {
                'en_retard' => fake()->randomElement(['pending', 'partial']),
                'boursier' => 'paid',
                default => fake()->randomElement(['paid', 'paid', 'paid', 'partial']),
            };
            $amount = $student->status === 'boursier' ? 0 : 350000;
            $invoice = Invoice::updateOrCreate(
                ['reference' => 'FAC-2025-'.$student->id.'-SCOL'],
                [
                    'student_id' => $student->id,
                    'fee_type_id' => $feeTypes['SCOL']->id,
                    'academic_year_id' => $year->id,
                    'term_id' => $term->id,
                    'issued_on' => '2025-09-15',
                    'due_on' => '2025-10-15',
                    'amount' => $amount,
                    'status' => $status,
                ]
            );

            $paid = match ($status) {
                'paid' => $amount,
                'partial' => round($amount * 0.5, 2),
                default => 0,
            };
            if ($paid > 0) {
                $month = random_int(9, 12);
                $yearNum = 2025;
                if (fake()->boolean(45)) {
                    $month = random_int(1, 6);
                    $yearNum = 2026;
                }
                $date = sprintf('%04d-%02d-%02d', $yearNum, $month, random_int(1, 27));
                Payment::updateOrCreate(
                    ['invoice_id' => $invoice->id, 'reference' => 'PAY-'.$invoice->id.'-1'],
                    [
                        'student_id' => $student->id,
                        'amount' => $paid,
                        'method' => fake()->randomElement(['cash', 'mobile_money', 'bank']),
                        'paid_on' => $date,
                        'status' => 'completed',
                    ]
                );
                $paidDates[] = $date;
            }

            if (fake()->boolean(35)) {
                $code = fake()->randomElement(['CANT', 'TRAN']);
                $fee = $feeTypes[$code];
                $invStatus = fake()->randomElement(['paid', 'pending']);
                $inv = Invoice::updateOrCreate(
                    ['reference' => 'FAC-2025-'.$student->id.'-'.$code],
                    [
                        'student_id' => $student->id,
                        'fee_type_id' => $fee->id,
                        'academic_year_id' => $year->id,
                        'term_id' => $term->id,
                        'issued_on' => '2025-10-01',
                        'due_on' => '2025-10-31',
                        'amount' => $fee->default_amount,
                        'status' => $invStatus,
                    ]
                );
                if ($invStatus === 'paid') {
                    Payment::updateOrCreate(
                        ['invoice_id' => $inv->id, 'reference' => 'PAY-'.$inv->id.'-1'],
                        [
                            'student_id' => $student->id,
                            'amount' => $fee->default_amount,
                            'method' => fake()->randomElement(['cash', 'mobile_money']),
                            'paid_on' => sprintf('2026-%02d-%02d', random_int(1, 6), random_int(1, 27)),
                            'status' => 'completed',
                        ]
                    );
                }
            }
        }
    }
}
