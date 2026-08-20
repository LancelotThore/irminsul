import type { Command } from '../types/command.js';
import { admin } from './admin/index.js';
import { build } from './build.js';
import { character } from './character.js';
import { characters } from './characters.js';
import { links } from './links.js';
import { materials } from './materials.js';
import { ping } from './ping.js';
import { reset } from './reset.js';

export const commands: Command[] = [
  ping,
  character,
  characters,
  links,
  reset,
  build,
  materials,
  admin,
];
