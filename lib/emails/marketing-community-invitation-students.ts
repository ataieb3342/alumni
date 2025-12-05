import { transporter } from './config'

interface StudentInvitationData {
  email: string
  firstName?: string
}

export async function sendMarketingCommunityInvitationStudents(data: StudentInvitationData) {
  const { email, firstName } = data
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,'

  const mailOptions = {
    from: `"Association VH Besançon" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Des anciens élèves sont là pour t\'aider 🎓',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f3f4f6;">

        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header violet -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎓</div>
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">VH Besançon Alumni</h1>
            <p style="margin: 8px 0 0; color: #ffffff; font-size: 16px;">Des anciens élèves qui sont passés par là</p>
          </div>

          <!-- Contenu -->
          <div style="padding: 30px;">

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              ${greeting}
            </p>

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              <strong>Parcoursup, stages, orientation...</strong> Ce n'est pas toujours simple de savoir quelle direction prendre. Et si tu pouvais échanger directement avec des anciens élèves qui sont passés par là ?
            </p>

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              <strong style="color: #667eea;">VH Besançon Alumni</strong> est une communauté d'anciens élèves et de personnel de Victor Hugo qui ont créé une plateforme pour t'accompagner.
            </p>

            <!-- Bénéfices avec focus aide -->
            <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; border-radius: 8px; padding: 20px; margin: 0 0 24px;">

              <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px;">
                <strong style="font-size: 18px;">💼 Trouve des stages facilement</strong><br>
                <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Des anciens élèves proposent des stages de seconde, de première, et bien plus. Ils comprennent la difficulté de chercher un stage sans réseau.
                </span>
              </p>

              <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px;">
                <strong style="font-size: 18px;">🎯 Obtiens des conseils d'orientation</strong><br>
                <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Échange directement avec des alumni qui ont fait prépa, BTS, fac, écoles... Pose toutes tes questions sur les filières qui t'intéressent.
                </span>
              </p>

              <p style="margin: 0; color: #1f2937; font-size: 15px;">
                <strong style="font-size: 18px;">🤝 Développe ton réseau</strong><br>
                <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Connecte-toi avec des professionnels qui ont commencé là où tu es aujourd'hui. Ils peuvent t'ouvrir des portes et te donner des conseils concrets.
                </span>
              </p>

            </div>

            <p style="margin: 0 0 8px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              <strong>L'adhésion est 100% gratuite</strong> et peut vraiment faire la différence pour ton avenir. 🚀
            </p>

            <p style="margin: 0 0 24px; color: #1f2937; font-size: 15px; line-height: 1.6;">
              L'inscription ne prend que 2 minutes.
            </p>

            <!-- Bouton CTA -->
            <div style="text-align: center; margin: 0 0 24px;">
              <a href="https://vh-besancon-alumni.fr/inscription" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Rejoindre la communauté →
              </a>
            </div>

            <p style="margin: 0; color: #9ca3af; font-size: 13px; text-align: center; line-height: 1.5;">
              Ou copie ce lien : <a href="https://vh-besancon-alumni.fr/inscription" style="color: #667eea;">vh-besancon-alumni.fr/inscription</a>
            </p>

          </div>

          <!-- Citation inspirante -->
          <div style="background-color: #fef3c7; padding: 20px 30px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px; font-style: italic; line-height: 1.6;">
              "Grâce à la plateforme, j'ai trouvé mon stage de seconde en deux jours. Un ancien élève m'a également conseillé sur mon orientation post-bac."
            </p>
            <p style="margin: 8px 0 0; color: #92400e; font-size: 13px; font-weight: 600;">
              — Sarah, élève de seconde
            </p>
          </div>

          <!-- Réseaux sociaux -->
          <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
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
            Tu reçois cet email car tu es élève de Victor Hugo.
          </p>
        </div>

      </body>
      </html>
    `,
    text: `
      VH Besançon Alumni - Des anciens élèves qui sont passés par là

      ${greeting}

      Parcoursup, stages, orientation... Ce n'est pas toujours simple de savoir quelle direction prendre. Et si tu pouvais échanger directement avec des anciens élèves qui sont passés par là ?

      VH Besançon Alumni est une communauté d'anciens élèves et de personnel de Victor Hugo qui ont créé une plateforme pour t'accompagner.

      💼 Trouve des stages facilement
      Des anciens élèves proposent des stages de seconde, de première, et bien plus. Ils comprennent la difficulté de chercher un stage sans réseau.

      🎯 Obtiens des conseils d'orientation
      Échange directement avec des alumni qui ont fait prépa, BTS, fac, écoles... Pose toutes tes questions sur les filières qui t'intéressent.

      🤝 Développe ton réseau
      Connecte-toi avec des professionnels qui ont commencé là où tu es aujourd'hui. Ils peuvent t'ouvrir des portes et te donner des conseils concrets.

      L'adhésion est 100% gratuite et peut vraiment faire la différence pour ton avenir.
      L'inscription ne prend que 2 minutes.

      Rejoindre la communauté : https://vh-besancon-alumni.fr/inscription

      "Grâce à la plateforme, j'ai trouvé mon stage de seconde en deux jours. Un ancien élève m'a également conseillé sur mon orientation post-bac."
      — Sarah, élève de seconde

      Suis-nous sur les réseaux :
      LinkedIn : https://www.linkedin.com/company/vh-besancon-alumni/
      Instagram : https://www.instagram.com/vh_besancon_alumni/

      ---
      VH Besançon Alumni
      Association loi 1901 • Par des anciens, pour les anciens ET les actuels
      contact@vh-besancon-alumni.fr

      Tu reçois cet email car tu es élève de Victor Hugo.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de recrutement étudiant:', error)
    return { success: false, error }
  }
}
