import { NextRequest, NextResponse } from 'next/server'

// Fonction pour générer le HTML de l'email admin nouvelle inscription
function getAdminNewUserNotificationHTML() {
  const userData = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    userType: 'alumni',
    userId: 'test-user-id'
  }

  const sanityUrl = `${process.env.SANITY_STUDIO_URL || 'https://www.vh-besancon-alumni.fr/studio'}/structure/user;${userData.userId}`

  const userTypeLabels: Record<string, string> = {
    lyceen: 'Lycéen',
    bts: 'BTS',
    prepa: 'Prépa',
    alumni: 'Ancien élève',
    staff: 'Personnel',
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #1e3a8a;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .info-box {
            background-color: white;
            padding: 15px;
            border-left: 4px solid #1e3a8a;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1e3a8a;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nouvelle demande d'inscription</h1>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            <p>Une nouvelle demande d'inscription a été soumise et attend validation :</p>

            <div class="info-box">
              <p><strong>Nom :</strong> ${userData.firstName} ${userData.lastName}</p>
              <p><strong>Email :</strong> ${userData.email}</p>
              <p><strong>Type de membre :</strong> ${userTypeLabels[userData.userType]}</p>
            </div>

            <p>Pour valider ou rejeter cette inscription, connectez-vous à Sanity Studio :</p>

            <div style="text-align: center;">
              <a href="${sanityUrl}" class="button">Voir le profil sur Sanity</a>
            </div>

            <p><strong>Actions à effectuer dans Sanity :</strong></p>
            <ol>
              <li>Vérifiez les informations du profil</li>
              <li>Changez le statut du compte de "En attente de validation" à "Actif"</li>
              <li>L'utilisateur pourra alors se connecter</li>
            </ol>
          </div>
          <div class="footer">
            <p>Association VH Besançon - Système de gestion</p>
          </div>
        </div>
      </body>
    </html>
  `
}

// Fonction pour générer le HTML de l'email de validation de compte
function getUserAccountValidatedHTML() {
  const userData = {
    firstName: 'Jean',
    email: 'jean.dupont@example.com'
  }

  const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/connexion`

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .emoji {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .success-box {
            background-color: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #10b981;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="emoji">🎉</div>
            <h1 style="margin: 0;">Bienvenue dans la communauté !</h1>
          </div>
          <div class="content">
            <p>Bonjour ${userData.firstName},</p>

            <div class="success-box">
              <p style="margin: 0; color: #047857; font-size: 16px;">
                <strong>Bonne nouvelle !</strong> Votre compte VH Besançon Alumni a été validé par notre équipe.
              </p>
            </div>

            <p>Vous pouvez maintenant vous connecter et accéder à toutes les fonctionnalités de la plateforme :</p>

            <ul>
              <li><strong>Annuaire</strong> - Retrouvez vos camarades et développez votre réseau</li>
              <li><strong>Offres</strong> - Consultez les opportunités de stages et d'emplois</li>
              <li><strong>Événements</strong> - Participez à nos rencontres et activités</li>
              <li><strong>Profil</strong> - Complétez votre parcours et partagez votre expérience</li>
            </ul>

            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Se connecter maintenant</a>
            </div>

            <p>Si le bouton ne fonctionne pas, copiez ce lien : <a href="${loginUrl}" style="color: #667eea;">${loginUrl}</a></p>

            <p style="margin-top: 30px;">Bienvenue dans la famille VH Besançon Alumni ! 🎓</p>
          </div>
          <div class="footer">
            <p>Association VH Besançon Alumni</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p><a href="mailto:contact@vh-besancon-alumni.fr" style="color: #6b7280;">contact@vh-besancon-alumni.fr</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}

// Fonction pour générer le HTML de l'email de réinitialisation de mot de passe
function getUserPasswordResetHTML() {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reinitialiser-mot-de-passe?token=example-token-123`

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #1e3a8a;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1e3a8a;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte Association VH Besançon.</p>
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #1e3a8a;">${resetUrl}</p>
            <p><strong>Ce lien expirera dans 1 heure.</strong></p>
            <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
          </div>
          <div class="footer">
            <p>Association VH Besançon</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

// Fonction pour générer le HTML de l'email de recrutement alumni
function getMarketingAlumniHTML() {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f3f4f6;">

      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

        <!-- Header violet -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎓</div>
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">VH Besançon Alumni</h1>
          <p style="margin: 8px 0 0; color: #ffffff; font-size: 16px;">Parce que tu as aussi galéré avec ton orientation</p>
        </div>

        <!-- Contenu -->
        <div style="padding: 30px;">

          <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
            Bonjour,
          </p>

          <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
            Tu te souviens du <strong>stress du post-bac</strong> ? De la galère pour trouver un stage de seconde ? De toutes ces questions sans réponses sur ton orientation ?
          </p>

          <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
            Aujourd'hui, des <strong>élèves de Victor Hugo vivent exactement la même chose</strong>. Et toi, tu peux les aider.
          </p>

          <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px; line-height: 1.6;">
            On a créé <strong style="color: #667eea;">VH Besançon Alumni</strong>, une communauté d'anciens élèves et de personnel pour :
          </p>

          <!-- Bénéfices avec focus aide -->
          <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; border-radius: 8px; padding: 20px; margin: 0 0 24px;">

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px;">
              <strong style="font-size: 18px;">🎯 Guider les élèves actuels</strong><br>
              <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                Partage ton parcours, conseille-les sur leur orientation, propose des stages de seconde, aide-les à y voir plus clair. Ce que toi tu aurais aimé avoir à leur âge.
              </span>
            </p>

            <p style="margin: 0 0 16px; color: #1f2937; font-size: 15px;">
              <strong style="font-size: 18px;">🤝 Retrouver tes camarades</strong><br>
              <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                Reconnecte avec tes anciens de promo, développe ton réseau professionnel, partage tes opportunités.
              </span>
            </p>

            <p style="margin: 0; color: #1f2937; font-size: 15px;">
              <strong style="font-size: 18px;">🎉 Créer du lien entre générations</strong><br>
              <span style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                Événements entre anciens, rencontres avec les élèves actuels, transmission d'expérience.
              </span>
            </p>

          </div>

          <p style="margin: 0 0 8px; color: #1f2937; font-size: 15px; line-height: 1.6;">
            <strong>Tu peux faire la différence</strong> dans le parcours d'un élève.
          </p>

          <p style="margin: 0 0 24px; color: #1f2937; font-size: 15px; line-height: 1.6;">
            L'adhésion est <strong>100% gratuite</strong> et ne prend que 2 minutes. 🚀
          </p>

          <!-- Bouton CTA -->
          <div style="text-align: center; margin: 0 0 24px;">
            <a href="https://vh-besancon-alumni.fr/alumni" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Rejoindre la communauté →
            </a>
          </div>

          <p style="margin: 0; color: #9ca3af; font-size: 13px; text-align: center; line-height: 1.5;">
            Ou copie ce lien : <a href="https://vh-besancon-alumni.fr/alumni" style="color: #667eea;">vh-besancon-alumni.fr/alumni</a>
          </p>

        </div>

        <!-- Citation inspirante -->
        <div style="background-color: #fef3c7; padding: 20px 30px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-size: 14px; font-style: italic; line-height: 1.6;">
            "L'association m'a permis de redonner ce que j'ai reçu. Guider un élève dans son orientation, c'est gratifiant et ça prend 30 minutes de son temps."
          </p>
          <p style="margin: 8px 0 0; color: #92400e; font-size: 13px; font-weight: 600;">
            — Un ancien membre du bureau
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
          Tu reçois cet email car tu es ancien(ne) élève ou personnel de Victor Hugo.
        </p>
      </div>

    </body>
    </html>
  `
}

// Fonction pour générer le HTML de l'email de recrutement étudiants
function getMarketingStudentsHTML() {
  return `
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
            Bonjour,
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
  `
}

// Page d'accueil listant tous les emails disponibles
function getIndexHTML() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Preview des emails - VH Besançon Alumni</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            color: white;
            font-size: 36px;
            margin-bottom: 12px;
            text-align: center;
          }
          .subtitle {
            color: rgba(255, 255, 255, 0.9);
            text-align: center;
            margin-bottom: 40px;
            font-size: 16px;
          }
          .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin-bottom: 32px;
            border-radius: 8px;
            color: #92400e;
            font-size: 14px;
          }
          .cards {
            display: grid;
            gap: 20px;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          }
          .card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          }
          .card-icon {
            font-size: 40px;
            margin-bottom: 16px;
          }
          .card-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #1f2937;
          }
          .card-description {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 20px;
            line-height: 1.5;
          }
          .card-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            transition: opacity 0.2s;
          }
          .card-button:hover {
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📧 Preview des emails</h1>
          <p class="subtitle">Visualisez tous les emails de la plateforme VH Besançon Alumni</p>

          <div class="warning">
            <strong>⚠️ Environnement de développement uniquement</strong><br>
            Cette page ne doit pas être accessible en production.
          </div>

          <div class="cards">
            <div class="card">
              <div class="card-icon">👨‍💼</div>
              <div class="card-title">Notification Admin</div>
              <div class="card-description">
                Email envoyé à l'administrateur lorsqu'un nouvel utilisateur s'inscrit et attend validation.
              </div>
              <a href="/api/dev/email-preview?type=admin-notification" class="card-button">
                Voir le preview →
              </a>
            </div>

            <div class="card">
              <div class="card-icon">🎉</div>
              <div class="card-title">Compte Validé</div>
              <div class="card-description">
                Email de bienvenue envoyé à l'utilisateur lorsque son compte est validé par un administrateur.
              </div>
              <a href="/api/dev/email-preview?type=account-validated" class="card-button">
                Voir le preview →
              </a>
            </div>

            <div class="card">
              <div class="card-icon">🔒</div>
              <div class="card-title">Réinitialisation MDP</div>
              <div class="card-description">
                Email contenant un lien de réinitialisation de mot de passe valable 1 heure.
              </div>
              <a href="/api/dev/email-preview?type=password-reset" class="card-button">
                Voir le preview →
              </a>
            </div>

            <div class="card">
              <div class="card-icon">🎓</div>
              <div class="card-title">Recrutement Alumni</div>
              <div class="card-description">
                Email marketing pour inviter les anciens élèves à rejoindre la communauté.
              </div>
              <a href="/api/dev/email-preview?type=marketing-alumni" class="card-button">
                Voir le preview →
              </a>
            </div>

            <div class="card">
              <div class="card-icon">📚</div>
              <div class="card-title">Recrutement Élèves</div>
              <div class="card-description">
                Email marketing pour inviter les élèves actuels à rejoindre la plateforme.
              </div>
              <a href="/api/dev/email-preview?type=marketing-students" class="card-button">
                Voir le preview →
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

export async function GET(request: NextRequest) {
  // Sécurité : ne permettre l'accès qu'en développement
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Cette route n\'est disponible qu\'en développement' },
      { status: 403 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')

  // Si aucun type n'est spécifié, afficher la page d'accueil
  if (!type) {
    return new NextResponse(getIndexHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }

  // Retourner le HTML de l'email demandé
  let html = ''

  switch (type) {
    case 'admin-notification':
      html = getAdminNewUserNotificationHTML()
      break
    case 'account-validated':
      html = getUserAccountValidatedHTML()
      break
    case 'password-reset':
      html = getUserPasswordResetHTML()
      break
    case 'marketing-alumni':
      html = getMarketingAlumniHTML()
      break
    case 'marketing-students':
      html = getMarketingStudentsHTML()
      break
    default:
      return NextResponse.json(
        { error: 'Type d\'email inconnu' },
        { status: 404 }
      )
  }

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}
