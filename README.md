# LFS2 grammar compression

Copyright 2023 Laurens Holst

## Project information

  * Author: Laurens Holst <laurens@grauw.nl>
  * Source: <https://hg.sr.ht/~grauw/lfs2-compression>
  * License: MIT

Implementation of LFS2 grammar compression described in the paper
[Linear-Time Text Compression by Longest-First Substitution][1] by Nakamura et al.

[Grammar compression][2] identifies and extracts repeated subsequences from a
string or a collection of strings, producing a context-free grammar (a directed
graph). Since finding the smallest grammar is NP-hard, greedy strategies were
developed as an approximation. Of these, LFS2 is one which runs in O(n) time.

## Example

Input:

    new Grammar([[Grammar.start, 'abcababc'.split('')]]).compress();

Output:

    Grammar {
      rules: Map(3) {
        Symbol(S) => [ Symbol(1), Symbol(2), Symbol(1) ],
        Symbol(1) => [ Symbol(2), 'c' ],
        Symbol(2) => [ 'a', 'b' ]
      }
    }

## References

[1]: <https://doi.org/10.3390/a2041429> (R. Nakamura, S. Inenaga, H. Bannai, T. Funamoto, M. Takeda, A. Shinohara. "Linear-Time Text Compression by Longest-First Substitution." Algorithms 2.4 (2009) 1429-1448)

[2]: <https://en.wikipedia.org/wiki/Grammar-based_code> (Wikipedia: Grammar-based compression)
