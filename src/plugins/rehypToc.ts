import type { Root } from 'hast'
import type { Plugin } from 'unified'
import { tocGenerator } from '../service/post/observe/tocGenerator'

export const rehypeToc: Plugin<[], Root> = () => {
  return (tree, file) => {
    const toc = tocGenerator.getToc(tree);
    file.data.toc = toc;
  }
}