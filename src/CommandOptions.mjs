/*
 * This file is a part of Asciidoctor Chunker project.
 * Copyright (c) 2021 Wataru Shito (@waterloo_jp)
 */
'use strict';

import commander from 'commander';

/**
 * 
 * @param {Array} argv The reference to `process.argv`.
 */
export const makeConfig = (argv) => {

  const args = commander.version('0.9')
    .name('node asciidoctor-chunker.js')
    .usage('<single.html> [options]')
    .option('-o, --outdir <directory>',
      'The output directory where the chunked html will be written out to.', 'html_chunks')
    .option('--depth <depth specifier>', 'See the description above.', '1')
    .description(`Description:
  Splits an html file generated by Asciidoctor to chunked htmls.
  The default output directory is 'html_chunks'. You can override
  it with the '-o' option.

  The default splits are made by preamble, parts, and chapters.
  You can specify the extraction level with the '--depth' option.

The Depth Specifier:
  You can list the multiple settings by connecting each specifier
  with a comma.  Each specifier is consisted of either a single
  number or collon separated two numbers.

  The single number sets the default level of extraction.  The
  number 1 is the application's default and it extracts the
  the chapter level.  The number 2 for section extraction,
  3 for subsection, and so on to 6.

  The list of collon separated numbers can change the extraction
  depth for specific chapters.  You can use hyphen to specify the
  range of chapters to set.

Example:
  --depth 2          The default level 2, all the chapters and
                     sections will be extracted.
  --depth 3,1:2,8:5  The default level 3, level 2 for Chap 1,
                     level 5 for Chap 8.
  --depth 1,3-8:2    The default level 1, level 2 for Chap 3 to 8.
  --depth 3-8:3      No default is set so default level is 1, and
                     level 3 for chap3 to 8.`)
    .parse(argv);

  // console.log(args);
  const { args: inputfile, depth, outdir } = args;

  if (inputfile.length !== 1) {
    args.help();
  }

  const d = parseDepth(depth);

  return { singleHTML: inputfile[0], config: { depth: d, outdir } };
}

/**
 * Parses the depth specifier as '1,3-5:6,8:4'
 * into an object:
 * ```
 * {
 *  default: 1,
 *  depth: {
 *    '3': 6,
 *    '4': 6,
 *    '5': 6,
 *    '8': 4
 *  }
 * }
 * ```
 * The default will be set 1 if not specified.
 * 
 * @param {string} depth
 */
export const parseDepth = (depth) =>
  depth.split(',')
  .map(e => {
    const [chap, level] = e.split(':');
    return level ? parseSpecifierTerm(chap, level) : { default: +chap };
  })
  .reduce((accum, e) => accum = { ...accum, ...e }, { default: 1 });

/**
 * Parses each term (the comma separated term) of depth
 * specifier and returns the chapter-depth object.
 * 
 * E.g.  chap='3-6', level='2' returns
 * ```
 * {
 *   '3': 2,
 *   '4': 2,
 *   '5': 2,
 *   '6': 2
 * }
 * ```
 * 
 * 
 * @param {string} chap Either 'num' or 'num-num' such as '3-9'
 *  which means from chapter 3 to 9.
 * @param level The level of extraction depth.
 * @returns the object with chapter number as a property name
 *   integer for a value.
 */
const parseSpecifierTerm = (chap, level) => {
  const [from, to] = chap.split('-').map(num => parseInt(num));
  return to ?
    // case with chap='3-6'
    new Array(to - from + 1)
    .fill(0).reduce((accum, e, i) => ({
      ...accum,
      [i + from]: +level
    }), {}) : // case with no hyphen
    {
      [from]: +level
    };
};
