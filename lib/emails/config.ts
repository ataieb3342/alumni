import nodemailer from 'nodemailer'

// Boîte lue par l'association : les réponses aux emails y arrivent
export const CONTACT_EMAIL = 'contact@vh-besancon-alumni.fr'

// Les emails partent toujours du compte Gmail de l'association : l'envoi
// depuis contact@ par le SMTP d'OVH échoue faute de certificat. EMAIL_USER et
// EMAIL_PASSWORD sont donc l'adresse Gmail et son mot de passe d'application.
export const transporter = nodemailer.createTransport(
  {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS sur le port 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  },
  {
    replyTo: `"Association VH Besançon" <${CONTACT_EMAIL}>`,
  }
)
