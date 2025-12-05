import { transporter } from './config'

interface AlumniWelcomeData {
  email: string
  firstName: string
  lastName: string
}

export async function sendMarketingAlumniWelcome(data: AlumniWelcomeData) {
  const { email, firstName, lastName } = data

  const mailOptions = {
    from: `"Association VH Besançon" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Rejoignez notre annuaire des anciens élèves ! 🎓',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f3f4f6;">

        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header violet -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎓</div>
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Bienvenue à VH Besançon Alumni</h1>
            <p style="margin: 8px 0 0; color: #ffffff; font-size: 16px;">Créez votre compte sur la plateforme</p>
          </div>

          <!-- Contenu -->
          <div style="padding: 30px;">

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              Bonjour ${firstName} ${lastName},
            </p>

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              Nous vous remercions pour votre adhésion à l'association <strong style="color: #667eea;">VH Besançon Alumni</strong>. 🎉
            </p>

            <p style="margin: 0 0 24px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              Vous pouvez désormais créer votre compte sur notre <strong>plateforme en ligne</strong>.
              Cela vous permettra d'avoir <strong>accès à l'annuaire</strong> VH Besançon Alumni et de profiter pleinement de votre adhésion !
            </p>

            <!-- Objectif de l'annuaire -->
            <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
              <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px; font-weight: bold;">
                🎯 L'objectif de notre annuaire
              </p>

              <p style="margin: 0 0 12px; color: #1f2937; font-size: 15px; line-height: 1.6;">
                Avoir une grande diversité de profils d'anciens élèves afin que les élèves actuels
                puissent découvrir de nombreuses possibilités <strong>post-bac / post-cpge / post-bts</strong>
                et poser leurs questions facilement.
              </p>
            </div>

            <!-- Pour les anciens élèves -->
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
              <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px; font-weight: bold;">
                👥 Si vous êtes ancien élève ou personnel du lycée
              </p>

              <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.6;">
                Vous pourrez compléter votre profil avec votre <strong>parcours scolaire et professionnel</strong>
                et laisser un moyen d'être contacté par les élèves actuels. Votre expérience peut être précieuse
                pour guider les futures générations ! 🌟
              </p>
            </div>

            <!-- Pour les élèves -->
            <div style="background-color: #fef3e2; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
              <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px; font-weight: bold;">
                📚 Si vous êtes élève
              </p>

              <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.6;">
                Vous pourrez parcourir l'annuaire et les différents profils des anciens élèves afin de
                les contacter selon vos besoins. Posez vos questions sur les formations, les métiers,
                les opportunités... 💬
              </p>
            </div>

            <!-- Bouton CTA -->
            <div style="text-align: center; margin: 0 0 24px;">
              <a href="https://vh-besancon-alumni.fr/inscription" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Créer mon compte →
              </a>
            </div>

            <p style="margin: 0 0 16px; color: #9ca3af; font-size: 13px; text-align: center; line-height: 1.5;">
              Ou copie ce lien : <a href="https://vh-besancon-alumni.fr/inscription" style="color: #667eea;">vh-besancon-alumni.fr/inscription</a>
            </p>

            <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center; line-height: 1.5;">
              Utilisez l'adresse email <strong style="color: #667eea;">${email}</strong> lors de votre inscription.
            </p>

          </div>

          <!-- Message de clôture -->
          <div style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
              On vous souhaite une bonne journée, en espérant vous retrouver sur notre annuaire
              ou aux différents évènements organisés par l'association ! 🎉
            </p>
          </div>

          <!-- Réseaux sociaux -->
          <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
            <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; font-weight: 600;">
              Suis-nous sur les réseaux
            </p>
            <p style="margin: 0;">
              <a href="https://www.linkedin.com/company/vh-besancon-alumni/" style="display: inline-block; margin: 0 8px; color: #667eea; text-decoration: none; font-weight: 600; font-size: 14px;">LinkedIn</a>
              <a href="https://www.instagram.com/vh_besancon_alumni/" style="display: inline-block; margin: 0 8px; color: #667eea; text-decoration: none; font-weight: 600; font-size: 14px;">Instagram</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 20px 30px; text-align: center; background-color: #1f2937;">
            <p style="margin: 0 0 8px; color: #ffffff; font-size: 14px; font-weight: 600;">
              VH Besançon Alumni
            </p>
            <p style="margin: 0 0 8px; color: #9ca3af; font-size: 13px;">
              Association loi 1901 • Par des anciens, pour les anciens ET les actuels
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 13px;">
              <a href="mailto:contact@vh-besancon-alumni.fr" style="color: #9ca3af; text-decoration: none;">contact@vh-besancon-alumni.fr</a>
            </p>
          </div>

        </div>

        <!-- Unsubscribe -->
        <div style="max-width: 600px; margin: 20px auto 0; text-align: center;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            Vous recevez cet email car vous êtes adhérent(e) de l'association.
          </p>
        </div>

      </body>
      </html>
    `,
    text: `
      VH Besançon Alumni - Rejoignez notre annuaire des anciens élèves

      Bonjour ${firstName} ${lastName},

      Nous vous remercions pour votre adhésion à l'association VH Besançon Alumni.

      Vous pouvez désormais créer votre compte sur notre plateforme en ligne.
      Cela vous permettra d'avoir accès à l'annuaire VH Besançon Alumni et de profiter pleinement de votre adhésion !

      🎯 L'objectif de notre annuaire

      Avoir une grande diversité de profils d'anciens élèves afin que les élèves actuels
      puissent découvrir de nombreuses possibilités post-bac / post-cpge / post-bts
      et poser leurs questions facilement.

      👥 Si vous êtes ancien élève ou personnel du lycée

      Vous pourrez compléter votre profil avec votre parcours scolaire et professionnel
      et laisser un moyen d'être contacté par les élèves actuels. Votre expérience peut être précieuse
      pour guider les futures générations !

      📚 Si vous êtes élève

      Vous pourrez parcourir l'annuaire et les différents profils des anciens élèves afin de
      les contacter selon vos besoins. Posez vos questions sur les formations, les métiers,
      les opportunités...

      Créer mon compte : https://vh-besancon-alumni.fr/inscription

      Utilisez l'adresse email ${email} lors de votre inscription.

      On vous souhaite une bonne journée, en espérant vous retrouver sur notre annuaire
      ou aux différents évènements organisés par l'association !

      Suis-nous sur les réseaux :
      LinkedIn : https://www.linkedin.com/company/vh-besancon-alumni/
      Instagram : https://www.instagram.com/vh_besancon_alumni/

      ---
      VH Besançon Alumni
      Association loi 1901 • Par des anciens, pour les anciens ET les actuels
      contact@vh-besancon-alumni.fr

      Vous recevez cet email car vous êtes adhérent(e) de l'association.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de bienvenue alumni:', error)
    return { success: false, error }
  }
}
