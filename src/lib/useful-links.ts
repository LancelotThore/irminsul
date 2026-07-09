export interface UsefulLink {
  id: string;
  emoji: string;
  label: string;
  url: string;
  description: string;
}

export const USEFUL_LINKS: UsefulLink[] = [
  {
    id: 'map-official',
    emoji: '🗺️',
    label: 'Carte interactive officielle',
    url: 'https://act.hoyolab.com/ys/app/interactive-map/index.html',
    description: "Localise ressources, coffres et points d'intérêt sur la carte de Teyvat.",
  },
  {
    id: 'map-alt',
    emoji: '🗺️',
    label: 'Carte interactive (alternative)',
    url: 'https://genshin-impact-map.appsample.com/',
    description: 'Autre carte interactive communautaire, filtres et suivi de progression.',
  },
  {
    id: 'wiki',
    emoji: '📖',
    label: 'HoYoWiki',
    url: 'https://wiki.hoyolab.com/pc/genshin/home',
    description: 'Wiki officiel : détails sur personnages, armes, quêtes et lore.',
  },
  {
    id: 'paimon-moe',
    emoji: '💧',
    label: 'Paimon.moe',
    url: 'https://paimon.moe/',
    description: 'Suivi de résine, planificateur de farm et to-do quotidienne.',
  },
  {
    id: 'genshin-optimizer',
    emoji: '⚙️',
    label: 'Genshin Optimizer',
    url: 'https://frzyc.github.io/genshin-optimizer/',
    description: "Calcul et optimisation d'artefacts pour maximiser un build.",
  },
  {
    id: 'akasha',
    emoji: '🏆',
    label: 'Akasha System',
    url: 'https://akasha.cv/',
    description: 'Classements et benchmarks de builds communautaires.',
  },
];
