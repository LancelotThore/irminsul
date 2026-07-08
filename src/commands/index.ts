import type { Command } from '../types/command.js';
import { character } from './character.js';
import { ping } from './ping.js';

export const commands: Command[] = [ping, character];
