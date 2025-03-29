import { loadWasm, WasmMemoryHelper } from "./load";

export type SudokuWasmExports = {
    // C functions exported from your WASM
    solve: (str_pointer: number) => number;
    free: (pointer: number) => void;
    malloc: (num: number) => number;
}

export type SudokuWasmModule = Awaited<ReturnType<typeof loadSudoku>>;

// Use the WASM functions
export async function loadSudoku(path: string) {
    try {
        const wasm = await loadWasm<SudokuWasmExports>(path, 1);
        const memoryHelper = new WasmMemoryHelper(wasm);
        return {
            solve: (line: string) => {
                if (wasm.memory === undefined) {
                    console.log("no wasm memory cannot continue")
                    return line;
                }
                const malloc = wasm.malloc
                const solve = wasm.solve
                const free = wasm.free;
                const totalLength = line.length + 1;
                // Allocate memory for the string using wasm malloc
                const inputPtr = memoryHelper.writeString(malloc(totalLength), line);

                // Call the solve function with the pointer to your input string
                const resultPtr = solve(inputPtr);

                // console.log("result ptr", resultPtr)
                const solvedLine = memoryHelper.readString(resultPtr, totalLength);

                // console.log("Solved board:", solvedLine);

                // Free the allocated memory (both input and result if applicable)
                free(inputPtr);
                free(resultPtr);
                return solvedLine;
            }
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            solve: (line: string) => {
                console.log('defaulted to js solve');
                return line
            }
        };
    }
}

export type SudokuBoard = string[][];
export type SerializedSudokuBoard = string;

function isNumeric(str: string) {
    return /^\d+$/.test(str);
}

function isBoardStringValid(board: SerializedSudokuBoard) {
    return board.length === 81 && isNumeric(board);
}

const LOCAL_STORAGE_KEY = "SUDOKU_BOARD_LOCAL_STORAGE";
const LOCAL_STORAGE_SOLUTION_KEY = "LOCAL_STORAGE_SOLUTION_KEY";

export function saveBoard(board: SudokuBoard) {
    const serialized = boardToString(board);
    if (!!window && !!window.localStorage) {
        localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
        return true;
    }
    return false;
}

export type SudokuGame = {
    current: SudokuBoard;
    solution: SerializedSudokuBoard;
}

export async function resetNewRandom(wasm: SudokuWasmModule): Promise<SudokuGame> {
    const newRandomBoard = createNewRandomBoard(wasm)
    saveBoard(newRandomBoard);
    const solution = wasm.solve(boardToString(newRandomBoard));
    localStorage.setItem(LOCAL_STORAGE_SOLUTION_KEY, solution);
    return {
        current: newRandomBoard,
        solution
    };
}

export async function getInitialBoard(wasm: SudokuWasmModule): Promise<SudokuGame> {
    if (!!window && !!window.localStorage) {
        const cachedBoard = localStorage.getItem(LOCAL_STORAGE_KEY);
        const cachedSolution = localStorage.getItem(LOCAL_STORAGE_SOLUTION_KEY);
        if (cachedBoard !== null && isBoardStringValid(cachedBoard) && cachedSolution !== null) {
            const cachedAsMatrix = stringToMatrix(cachedBoard);
            return {
                current: cachedAsMatrix,
                solution: cachedSolution
            }
        }
    }

    const newRandomBoard = createNewRandomBoard(wasm)
    saveBoard(newRandomBoard)
    const solution = wasm.solve(boardToString(newRandomBoard));
    localStorage.setItem(LOCAL_STORAGE_SOLUTION_KEY, solution);
    return {
        current: newRandomBoard,
        solution
    }
}


async function createNewWithRetry(wasm: SudokuWasmModule) {
    while (true) {
        const result = await executeWithTimeout(async () => createNewRandomBoard(wasm), 1000);
        if (result !== null) {
            return result;
        }
        console.log("took too long, retrying")
    }
}

function stringToMatrix(str: SerializedSudokuBoard) {
    const rows = 9, cols = 9;
    const matrix = new Array(rows);

    for (let i = 0; i < rows; i++) {
        const offset = i * cols;
        matrix[i] = new Array(cols);
        for (let j = 0; j < cols; j++) {
            matrix[i][j] = str[offset + j];
        }
    }

    return matrix;
}

// Helper function to convert matrix to string for the solver
// function boardToString(matrix: SudokuBoard): string {
//     return matrix.flat().join("");
// }

// Helper function to convert matrix to string for the solver
function boardToString(matrix: string[][]): string {
    let result = "";
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            result += matrix[i][j];
        }
    }
    return result;
}


// Helper function to get row/col from flat position
function getRowCol(position: number): [number, number] {
    const row = Math.floor(position / 9);
    const col = position % 9;
    return [row, col];
}

// Helper function to get flat position from row/col
function getPosition(row: number, col: number): number {
    return row * 9 + col;
}


function getRandomRemainingPosition(remainingSet: Set<number>): number {
    const remainingArr = [...remainingSet];
    return remainingArr[Math.floor(Math.random() * remainingArr.length)];
}

function createNewRemainingCells() {
    const remaining = new Set<number>();
    for (let i = 0; i < 81; i++) {
        remaining.add(i);
    }
    return remaining
}

/**
 * Creates a new random Sudoku board with exactly 17 filled cells
 * @param {Object} wasm - WASM module with a solve method
 * @returns {string} - An 81-character string representing the board
 */
function createNewRandomBoard(wasm: SudokuWasmModule): SudokuBoard {
    // Start with an empty board
    let board: string[][] = Array(9).fill(null).map(() => Array(9).fill("0"));
    const remainingCells = createNewRemainingCells();
    let consecutiveFailures = 0;
    console.log("creating new random board")

    // Try to place digits one by one, 17 is the min number to have a unique solveable board.
    while (remainingCells.size > (81 - 9)) {
        // If we've failed too many times, switch to the alternate approach
        if (consecutiveFailures >= 2) {
            console.log(`Switching to alternate approach after ${consecutiveFailures} failures`);
            const fallback = fallbackApproach(wasm, board, remainingCells);
            console.log("created new random board using fallback");
            return fallback;
        }

        // Find an empty cell position
        const position = getRandomRemainingPosition(remainingCells);
        const [row, col] = getRowCol(position);
        const digit = Math.floor(Math.random() * 9) + 1;

        // Create a new board with this digit placed
        const newBoard = JSON.parse(JSON.stringify(board)); // Deep clone
        newBoard[row][col] = digit.toString();

        // Check if the board is still solvable
        const boardString = boardToString(newBoard);
        const solution = wasm.solve(boardString);

        // Check if it's a valid solution (not the same as input with zeros)
        if (solution && solution !== boardString && !solution.includes("0")) {
            // The placement is valid, keep it
            console.log("added new random position")
            board = newBoard;
            remainingCells.delete(position);
            consecutiveFailures = 0; // Reset failure counter on success
        } else {
            consecutiveFailures++; // Increment failure counter
        }
    }
    console.log("created new random board");
    return fallbackApproach(wasm, board, remainingCells);
}

/**
 * Fallback approach when the incremental method fails too many times
 */
function fallbackApproach(
    wasm: any,
    currentBoard: SudokuBoard,
    remainingCells: Set<number>
): SudokuBoard {
    console.log("using fallback approach")
    // Convert current board to string
    const boardString = boardToString(currentBoard);
    const solution = wasm.solve(boardString);
    console.log("fallback got solution")
    // Try to place digits one by one, 17 is the min number to have a unique solveable board.
    while (remainingCells.size > (81 - 17)) {
        // Find an empty cell position
        const position = getRandomRemainingPosition(remainingCells);
        const value = solution[position];
        const [row, col] = getRowCol(position);
        currentBoard[row][col] = value;
        remainingCells.delete(position);
    }
    console.log("successfully ran fallback approach")
    return currentBoard;
}


/**
 * Executes an async function with a timeout
 * @param callback - The async function to execute
 * @param timeoutMs - Maximum execution time in milliseconds
 * @param args - Arguments to pass to the callback function
 * @returns The result of the callback if completed within the timeout, otherwise null
 */
async function executeWithTimeout<T>(
    callback: (...args: any[]) => Promise<T>,
    timeoutMs: number,
    ...args: any[]
): Promise<T | null> {
    try {
        // Use Promise.race to race between the callback and a timeout
        const result = await Promise.race([
            // The actual async callback execution
            callback(...args),

            // A promise that resolves to null after the timeout
            new Promise<null>((resolve) => {
                setTimeout(() => resolve(null), timeoutMs);
            })
        ]);

        return result;
    } catch (error) {
        console.error("Error executing callback:", error);
        return null;
    }
}
