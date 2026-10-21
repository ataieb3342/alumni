'use client'

/**
 * Composants d'édition chargés à la demande. Les pages publiques les
 * référencent (via createEditor) mais ne les rendent qu'en mode édition :
 * importés directement, ils (et les schémas Zod des contenus) partaient dans
 * le JavaScript de chaque visiteur.
 */
import dynamic from 'next/dynamic'

export const EditorShell = dynamic(() => import('./EditorShell').then((m) => m.EditorShell))
export const EditRoot = dynamic(() => import('./EditorShell').then((m) => m.EditRoot))
export const EditableText = dynamic(() => import('./EditableText').then((m) => m.EditableText))
export const EditableRichText = dynamic(() => import('./EditableRichText').then((m) => m.EditableRichText))
export const EditableImage = dynamic(() => import('./EditableImage').then((m) => m.EditableImage))
export const EditableLink = dynamic(() => import('./EditableLink').then((m) => m.EditableLink))
export const EditableList = dynamic(() => import('./EditableList').then((m) => m.EditableList))
export const EditableIcon = dynamic(() => import('./EditableIcon').then((m) => m.EditableIcon))
export const PostSettings = dynamic(() => import('@/app/components/blog/PostSettings').then((m) => m.PostSettings))
export const NewPostButton = dynamic(() => import('@/app/components/blog/NewPostButton').then((m) => m.NewPostButton))
