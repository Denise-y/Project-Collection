module Water where

import Data.List (find, minimumBy)
import Data.Maybe (fromMaybe)
import qualified Data.Set as Set

type State = (Int, Int)
type SolutionPath = ([State], Bool, Int)

nextStates :: (Int, Int) -> State -> [State]
nextStates (xMax, yMax) (x, y) =
  [ (xMax, y)
  , (x, yMax)
  , (0, y)
  , (x, 0)
  , (x - min x (yMax - y), y + min x (yMax - y))
  , (x + min y (xMax - x), y - min y (xMax - x))
  ]

isTarget :: State -> State -> Bool
isTarget target (a, b) = (a, b) == target

bfs :: (Int, Int) -> State -> State -> [[State]]
bfs capacities start target = search [[start]]
  where
    search [] = []
    search (path:rest) =
      let currentState = last path
          newStates = filter (`Set.notMember` visited) $ nextStates capacities currentState
          visited = Set.fromList (concat (path : rest))
          newPaths = [path ++ [newState] | newState <- newStates]
      in if any (isTarget target) newStates
         then filter (isTarget target . last) newPaths ++ search rest
         else search (newPaths ++ rest)

solutionPath :: (Int, Int) -> State -> State -> [SolutionPath]
solutionPath capacities start target =
  let paths = bfs capacities start target
      shortestLength = if null paths then 0 else minimum (map length paths)
      pathsWithLength = [(path, length path == shortestLength, length path) | path <- paths]
  in pathsWithLength

