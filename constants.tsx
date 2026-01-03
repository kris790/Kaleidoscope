
import React from 'react';
import { StylePreset, UserTier } from './types';

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Highly detailed, film-like quality with dramatic lighting.',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=300&h=200&auto=format&fit=crop',
    promptSuffix: ', highly detailed, cinematic lighting, 8k, film grain, masterpiece'
  },
  {
    id: 'anime',
    name: 'Anime',
    description: 'Vibrant, cel-shaded Japanese animation style.',
    thumbnail: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=300&h=200&auto=format&fit=crop',
    promptSuffix: ', anime style, vibrant colors, cel shaded, Makoto Shinkai aesthetics, high quality digital art'
  },
  {
    id: '3d-render',
    name: '3D Pixar',
    description: 'High-end 3D animation with soft lighting and expressive characters.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=300&h=200&auto=format&fit=crop',
    promptSuffix: ', 3d render, pixar style, octanerender, raytracing, soft shadows, vibrant colors, 4k'
  },
  {
    id: 'claymation',
    name: 'Claymation',
    description: 'Stop-motion clay aesthetic with tactile textures.',
    thumbnail: 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=300&h=200&auto=format&fit=crop',
    promptSuffix: ', claymation, stop motion, plasticine texture, handcrafted look, finger prints visible, aardman style'
  },
  {
    id: 'noir',
    name: 'Film Noir',
    description: 'High contrast black and white with moody shadows.',
    thumbnail: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=300&h=200&auto=format&fit=crop',
    promptSuffix: ', film noir, black and white, high contrast, dramatic shadows, smoky atmosphere, 1940s aesthetic'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon-soaked futuristic aesthetic.',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&h=200&auto=format&fit=crop',
    promptSuffix: ', cyberpunk aesthetic, neon lights, futuristic city, rainy night, synthwave colors, glowing textures'
  },
  {
    id: 'sketch',
    name: 'Charcoal',
    description: 'Rough, expressive charcoal and pencil sketch.',
    thumbnail: 'https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?q=80&w=300&h=200&auto=format&fit=crop',
    promptSuffix: ', charcoal drawing, pencil sketch, rough textures, artistic crosshatching, hand-drawn look'
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    description: '80s retro-futuristic aesthetic with pink and teal palettes.',
    thumbnail: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=300&h=200&auto=format&fit=crop',
    promptSuffix: ', vaporwave aesthetic, lo-fi, glitch art, pink and teal, retro futuristic, VHS quality'
  }
];

export const TIER_CONFIG = {
  [UserTier.FREE]: {
    maxDuration: 5,
    resolution: '720p',
    creditsPerSec: 1,
    concurrentProjects: 3,
  },
  [UserTier.PLUS]: {
    maxDuration: 10,
    resolution: '720p',
    creditsPerSec: 1,
    concurrentProjects: 10,
  },
  [UserTier.PRO]: {
    maxDuration: 20,
    resolution: '1080p',
    creditsPerSec: 2,
    concurrentProjects: 50,
  }
};
