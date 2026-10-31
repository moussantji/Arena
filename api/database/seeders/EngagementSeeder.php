<?php

namespace Database\Seeders;

use App\Models\Admission;
use App\Models\AppNotification;
use App\Models\Message;
use App\Models\MessageThread;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Database\Seeder;

class EngagementSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'direction@diallo.test')->first();
        $classes = SchoolClass::orderBy('id')->get()->keyBy('name');

        $admissions = [
            ['REF-2026-042', 'Aminata', 'Cissé', 'F', 'Terminale S', 'nouveau', '2026-10-24'],
            ['REF-2026-043', 'Ibrahim', 'Traoré', 'M', 'Première S', 'nouveau', '2026-10-24'],
            ['REF-2026-044', 'Fatou', 'Diallo', 'F', 'Seconde A', 'nouveau', '2026-10-23'],
            ['REF-2026-031', 'Moussa', 'Bâ', 'M', 'Terminale L', 'entretien', '2026-10-20'],
            ['REF-2026-032', 'Awa', 'Konaté', 'F', 'Première ES', 'entretien', '2026-10-19'],
            ['REF-2026-033', 'Seydou', 'Sow', 'M', 'Seconde B', 'entretien', '2026-10-18'],
            ['REF-2026-018', 'Nafissatou', 'Sy', 'F', 'Terminale S', 'valide', '2026-10-12'],
            ['REF-2026-019', 'Oumar', 'Barry', 'M', 'Première S', 'valide', '2026-10-11'],
            ['REF-2026-020', 'Kadidia', 'Camara', 'F', 'Seconde A', 'valide', '2026-10-10'],
            ['REF-2026-004', 'Mariam', 'Traoré', 'F', 'Terminale L', 'inscrit', '2026-09-25'],
            ['REF-2026-005', 'Jean', 'Cissé', 'M', 'Première ES', 'inscrit', '2026-09-24'],
            ['REF-2026-006', 'Aminata', 'Sow', 'F', 'Seconde B', 'inscrit', '2026-09-23'],
        ];
        foreach ($admissions as [$ref, $first, $last, $gender, $className, $status, $date]) {
            Admission::updateOrCreate(['reference' => $ref], [
                'first_name' => $first,
                'last_name' => $last,
                'gender' => $gender,
                'birth_date' => fake()->dateTimeBetween('2007-01-01', '2011-12-31')->format('Y-m-d'),
                'desired_class_id' => $classes[$className]?->id,
                'guardian_name' => fake()->name(),
                'guardian_phone' => '+223 76 '.random_int(10, 99).' '.random_int(10, 99).' '.random_int(10, 99),
                'guardian_email' => strtolower($first.'.'.$last).'@famille.ml',
                'status' => $status,
                'applied_on' => $date,
                'decision_on' => in_array($status, ['valide', 'inscrit', 'refuse'], true) ? $date : null,
            ]);
        }

        $threads = [
            [
                'subject' => "Absence d'Aminata du 23 octobre",
                'type' => 'parent',
                'messages' => [
                    ['guardian', 'Mme Traoré', '09:31', "Bonjour Monsieur, je voulais vérifier la présence d'Aminata du 23 octobre.", false],
                    ['staff', 'M. Diallo', '09:34', "Bonjour Madame. L'absence est enregistrée à 08:00, justificatif bien transmis ce matin.", true],
                    ['guardian', 'Mme Traoré', '09:38', 'Parfait, merci. Le solde de la scolarité est-il à jour ?', false],
                    ['staff', 'M. Diallo', '09:41', "Oui, les frais de scolarité sont réglés. Le reçu de février est disponible dans l'espace parents.", true],
                ],
            ],
            [
                'subject' => 'Solde de la scolarité',
                'type' => 'parent',
                'messages' => [
                    ['guardian', 'M. Konaté', '09:10', 'Bonjour, concernant le solde de la scolarité de Ibrahim…', false],
                    ['staff', 'Mme Barry', '09:18', 'Bonjour, il reste 47 000 FCFA à régler. Un échéancier est possible.', true],
                ],
            ],
            [
                'subject' => 'Conseil de classe vendredi',
                'type' => 'internal',
                'messages' => [
                    ['staff', 'Vie scolaire', '08:05', 'Rappel : conseil de classe vendredi à 16:00 en salle 10.', false],
                ],
            ],
            [
                'subject' => 'Bulletin trimestre 1',
                'type' => 'parent',
                'messages' => [
                    ['guardian', 'Mme Sow', 'lun.', 'Merci pour le bulletin du trimestre.', false],
                    ['staff', 'M. Diallo', 'lun.', 'Avec plaisir. Les appréciations sont disponibles dans le document joint.', true],
                ],
            ],
            [
                'subject' => 'Reçus de février',
                'type' => 'internal',
                'messages' => [
                    ['staff', 'Service financier', 'lun.', 'Les reçus de février sont émis et disponibles.', false],
                ],
            ],
        ];

        foreach ($threads as $data) {
            $last = end($data['messages']);
            $thread = MessageThread::updateOrCreate(
                ['subject' => $data['subject']],
                [
                    'type' => $data['type'],
                    'created_by' => $admin?->id,
                    'last_message_at' => now()->setTime((int) substr($last[2], 0, 2), (int) substr($last[2], 3, 2)),
                    'is_archived' => false,
                ]
            );
            foreach ($data['messages'] as [$senderType, $senderName, $time, $body, $read]) {
                Message::updateOrCreate(
                    ['message_thread_id' => $thread->id, 'body' => $body],
                    [
                        'sender_type' => $senderType,
                        'sender_name' => $senderName,
                        'sent_at' => now()->setTime((int) substr($time, 0, 2), (int) substr($time, 3, 2)),
                        'read_at' => $read ? now() : null,
                    ]
                );
            }
        }

        $notifications = [
            ['Nouvelle inscription', 'Aminata Cissé · Terminale S', 'admission'],
            ['Paiement reçu', '8,45 M FCFA · Frais de scolarité', 'payment'],
            ['Absence non justifiée', 'Moussa Camara · Seconde A', 'absence'],
        ];
        foreach ($notifications as [$title, $body, $type]) {
            AppNotification::updateOrCreate(
                ['title' => $title, 'body' => $body],
                ['type' => $type, 'read_at' => null]
            );
        }
    }
}
