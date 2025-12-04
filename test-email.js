// Script de test pour vérifier l'envoi d'email
// Usage: node test-email.js

require('dotenv').config({ path: '.env.local' });

const { sendAccountValidatedEmail } = require('./lib/email.ts');

async function testEmail() {
  console.log('🧪 Test d\'envoi d\'email de validation...\n');

  console.log('Variables d\'environnement :');
  console.log('- EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('- EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('- EMAIL_USER:', process.env.EMAIL_USER);
  console.log('- EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Défini' : '✗ Non défini');
  console.log('- NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
  console.log('');

  // Utilise ton propre email pour tester
  const result = await sendAccountValidatedEmail({
    firstName: 'Test',
    lastName: 'Utilisateur',
    email: process.env.EMAIL_USER, // Envoie à toi-même
  });

  if (result.success) {
    console.log('✅ Email envoyé avec succès !');
    console.log('Vérifie ta boîte mail.');
  } else {
    console.error('❌ Erreur lors de l\'envoi :');
    console.error(result.error);
  }
}

testEmail().catch(console.error);
