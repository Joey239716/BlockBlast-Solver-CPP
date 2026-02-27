/* #include <iostream>
#include <unordered_map>
#include "pieceLibrary.h"
#include "board.h"


Flow of the program 
1. Read the board state from the user input
2. Read the 3 pieces from the user input
3. For each piece - Try placing into valid spot on the board and simulate the blast, then move on to the next piece.
4. If all 3 pieces are placed successfully, print the solution. If not, backtrack and try a different placement for the previous piece.
5. If no answer, unlucky i guess. L



int main() {
    
    

    return 0;
}    */ 

#include "iostream"
#include "imgui.h"
#include "imgui_impl_sdl2.h"
#include "imgui_impl_sdlrenderer2.h"
#include <stdio.h>
#include <SDL.h>
#include "pieceLibrary.h"
#include "board.h"
#include "availablePieces.h"
#include "solver.h"
#ifdef _WIN32
#include <windows.h>        // SetProcessDPIAware()
#endif

#if !SDL_VERSION_ATLEAST(2,0,17)
#error This backend requires SDL 2.0.17+ because of SDL_RenderGeometry() function
#endif

// Main code
int main() {
    SDL_Init(SDL_INIT_VIDEO);
    SDL_Window* window = SDL_CreateWindow("BlockBlast Solver",
        SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
        800, 600, SDL_WINDOW_SHOWN);
    SDL_Renderer* renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);

    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGui_ImplSDL2_InitForSDLRenderer(window, renderer);
    ImGui_ImplSDLRenderer2_Init(renderer);

    bool showSolution = false;
    bool running = true;
    BlockBlastSolver solver;
    BlockBlastSolver::Solution result;

    while (running) {
        SDL_Event event;
        while (SDL_PollEvent(&event))
            if (event.type == SDL_QUIT) running = false;
            else ImGui_ImplSDL2_ProcessEvent(&event);

        ImGui_ImplSDLRenderer2_NewFrame();
        ImGui_ImplSDL2_NewFrame();
        ImGui::NewFrame();

        ImGui::Begin("Current Board Setup");
        for (int row = 0; row < 8; row++) {
            for (int col = 0; col < 8; col++) {
                if (col > 0) ImGui::SameLine();
                char id[16];
                snprintf(id, sizeof(id), "##A%d_%d", row, col);

                if (board[row][col]) {
                        ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(1, 0, 0, 1));
                }
                else {
                        ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0.2f, 0.2f, 0.2f, 1));
                }

                if (ImGui::Button(id, ImVec2(25, 25))) {
                    board[row][col] = !board[row][col];
                }
                ImGui::PopStyleColor();
            }
        }
        
        ImGui::Spacing();
        ImGui::Separator();
        ImGui::Spacing();

        auto drawPiece = [&](const char* label, bool pieceBoard[3][3], 
                      std::unordered_set<Point, PointHash>& piece, char prefix) {
        

        ImGui::BeginGroup();
        ImGui::Text("%s", label);
        for (int row = 0; row < 3; row++) {
            for (int col = 0; col < 3; col++) 
            {
                if (col > 0) ImGui::SameLine();
                char id[16];
                snprintf(id, sizeof(id), "##%c%d_%d", prefix, row, col);
                ImGui::PushStyleColor(ImGuiCol_Button, pieceBoard[row][col] ? ImVec4(1,0,0,1) : ImVec4(0.2f,0.2f,0.2f,1));
                if (ImGui::Button(id, ImVec2(25, 25))) {
                    pieceBoard[row][col] = !pieceBoard[row][col];
                    Point point = {col, row};
                    if (pieceBoard[row][col]) piece.insert(point);
                    else piece.erase(point);
            }
            ImGui::PopStyleColor();
            }
            }
            ImGui::EndGroup();
        };

        drawPiece("Piece 1", board1, piece1, 'B');
        ImGui::SameLine(0, 20);
        drawPiece("Piece 2", board2, piece2, 'C');
        ImGui::SameLine(0, 20);
        drawPiece("Piece 3", board3, piece3, 'D');

        ImGui::Spacing();
        ImGui::Separator();
        ImGui::Spacing();

        if (ImGui::Button("Solve")) {
            result = solver.Solve(piece1, piece2, piece3, board);
            showSolution = true;

            if (result.found) {
                int i = 0;
                for (const auto moveOrder : result.solutionOrder) {
                    std::vector<Point> place = result.solutionPlacements[moveOrder];
                    for (const auto& coordinate : place) {
                        board[coordinate.y][coordinate.x] = 2;
                    }
                    memcpy(moves[i], board, sizeof(board));
                    solver.simulateBlast(board);

                    for (size_t r = 0; r < 8; ++r) {
                        for (size_t c = 0; c < 8; ++c) {
                            if (board[r][c] == 2) board[r][c] = 1;
                        }
                    }
                    i += 1;
                }
                

                // print here, runs only once when button is clicked
                for (int i = 0; i < 3; i++) {
                    std::cout << "Move " << i + 1 << ":\n";
                    for (int row = 0; row < 8; row++) {
                        for (int col = 0; col < 8; col++) {
                            std::cout << moves[i][row][col] << " ";
                        }
                        std::cout << "\n";
                    }
                    std::cout << "\n";
                }
            }
        }
        ImGui::End();

        if (showSolution) {
            ImGui::Begin("Solution", &showSolution);
            if (!result.found) ImGui::Text("No solution found.");
            ImGui::End();
        }

        

        ImGui::Render();
        SDL_RenderClear(renderer);
        ImGui_ImplSDLRenderer2_RenderDrawData(ImGui::GetDrawData(), renderer);
        SDL_RenderPresent(renderer);
    }

    ImGui_ImplSDLRenderer2_Shutdown();
    ImGui_ImplSDL2_Shutdown();
    ImGui::DestroyContext();
    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    SDL_Quit();
}