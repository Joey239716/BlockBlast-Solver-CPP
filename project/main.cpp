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
#include <windows.h>
#endif

#if !SDL_VERSION_ATLEAST(2,0,17)
#error This backend requires SDL 2.0.17+ because of SDL_RenderGeometry() function
#endif

static void ApplyBlockBlastTheme() {
    ImGuiStyle& style = ImGui::GetStyle();

    style.WindowRounding    = 12.0f;
    style.ChildRounding     = 8.0f;
    style.FrameRounding     = 6.0f;
    style.PopupRounding     = 8.0f;
    style.ScrollbarRounding = 6.0f;
    style.GrabRounding      = 6.0f;
    style.TabRounding       = 6.0f;

    style.WindowPadding     = ImVec2(18, 18);
    style.FramePadding      = ImVec2(8, 6);
    style.ItemSpacing       = ImVec2(10, 8);
    style.ItemInnerSpacing  = ImVec2(6, 6);
    style.ScrollbarSize     = 10.0f;
    style.GrabMinSize       = 10.0f;
    style.WindowBorderSize  = 0.0f;
    style.FrameBorderSize   = 0.0f;
    style.PopupBorderSize   = 0.0f;

    ImVec4* colors = style.Colors;

    // Background layers
    colors[ImGuiCol_WindowBg]           = ImVec4(0.08f, 0.09f, 0.12f, 1.00f);
    colors[ImGuiCol_ChildBg]            = ImVec4(0.11f, 0.12f, 0.16f, 1.00f);
    colors[ImGuiCol_PopupBg]            = ImVec4(0.10f, 0.11f, 0.14f, 1.00f);

    // Headers
    colors[ImGuiCol_Header]             = ImVec4(0.20f, 0.22f, 0.30f, 1.00f);
    colors[ImGuiCol_HeaderHovered]      = ImVec4(0.26f, 0.28f, 0.38f, 1.00f);
    colors[ImGuiCol_HeaderActive]       = ImVec4(0.30f, 0.33f, 0.45f, 1.00f);

    // Buttons — neutral slate
    colors[ImGuiCol_Button]             = ImVec4(0.18f, 0.20f, 0.27f, 1.00f);
    colors[ImGuiCol_ButtonHovered]      = ImVec4(0.26f, 0.29f, 0.40f, 1.00f);
    colors[ImGuiCol_ButtonActive]       = ImVec4(0.33f, 0.37f, 0.52f, 1.00f);

    // Frame backgrounds
    colors[ImGuiCol_FrameBg]            = ImVec4(0.14f, 0.15f, 0.20f, 1.00f);
    colors[ImGuiCol_FrameBgHovered]     = ImVec4(0.20f, 0.22f, 0.30f, 1.00f);
    colors[ImGuiCol_FrameBgActive]      = ImVec4(0.24f, 0.26f, 0.36f, 1.00f);

    // Title bars
    colors[ImGuiCol_TitleBg]            = ImVec4(0.06f, 0.07f, 0.09f, 1.00f);
    colors[ImGuiCol_TitleBgActive]      = ImVec4(0.10f, 0.11f, 0.16f, 1.00f);
    colors[ImGuiCol_TitleBgCollapsed]   = ImVec4(0.06f, 0.07f, 0.09f, 1.00f);

    // Separator / border
    colors[ImGuiCol_Separator]          = ImVec4(0.22f, 0.24f, 0.32f, 1.00f);
    colors[ImGuiCol_SeparatorHovered]   = ImVec4(0.35f, 0.38f, 0.52f, 1.00f);
    colors[ImGuiCol_SeparatorActive]    = ImVec4(0.45f, 0.50f, 0.68f, 1.00f);

    // Scrollbar
    colors[ImGuiCol_ScrollbarBg]        = ImVec4(0.08f, 0.09f, 0.12f, 1.00f);
    colors[ImGuiCol_ScrollbarGrab]      = ImVec4(0.22f, 0.24f, 0.32f, 1.00f);
    colors[ImGuiCol_ScrollbarGrabHovered]= ImVec4(0.30f, 0.32f, 0.44f, 1.00f);
    colors[ImGuiCol_ScrollbarGrabActive]= ImVec4(0.38f, 0.42f, 0.58f, 1.00f);

    // Accent (cyan-blue glow)
    colors[ImGuiCol_CheckMark]          = ImVec4(0.40f, 0.80f, 1.00f, 1.00f);
    colors[ImGuiCol_SliderGrab]         = ImVec4(0.40f, 0.80f, 1.00f, 1.00f);
    colors[ImGuiCol_SliderGrabActive]   = ImVec4(0.55f, 0.90f, 1.00f, 1.00f);

    // Resize grip
    colors[ImGuiCol_ResizeGrip]         = ImVec4(0.25f, 0.28f, 0.38f, 0.50f);
    colors[ImGuiCol_ResizeGripHovered]  = ImVec4(0.35f, 0.40f, 0.55f, 0.80f);
    colors[ImGuiCol_ResizeGripActive]   = ImVec4(0.45f, 0.52f, 0.70f, 1.00f);

    // Tabs
    colors[ImGuiCol_Tab]                = ImVec4(0.12f, 0.13f, 0.18f, 1.00f);
    colors[ImGuiCol_TabHovered]         = ImVec4(0.26f, 0.29f, 0.40f, 1.00f);
    colors[ImGuiCol_TabActive]          = ImVec4(0.20f, 0.22f, 0.32f, 1.00f);
    colors[ImGuiCol_TabUnfocused]       = ImVec4(0.10f, 0.11f, 0.15f, 1.00f);
    colors[ImGuiCol_TabUnfocusedActive] = ImVec4(0.16f, 0.18f, 0.25f, 1.00f);

    // Text
    colors[ImGuiCol_Text]               = ImVec4(0.88f, 0.90f, 0.96f, 1.00f);
    colors[ImGuiCol_TextDisabled]       = ImVec4(0.38f, 0.40f, 0.50f, 1.00f);

    // Misc
    colors[ImGuiCol_MenuBarBg]          = ImVec4(0.10f, 0.11f, 0.15f, 1.00f);
    colors[ImGuiCol_NavHighlight]       = ImVec4(0.40f, 0.80f, 1.00f, 1.00f);
    colors[ImGuiCol_NavWindowingHighlight] = ImVec4(0.40f, 0.80f, 1.00f, 0.70f);
    colors[ImGuiCol_NavWindowingDimBg]  = ImVec4(0.05f, 0.05f, 0.08f, 0.70f);
    colors[ImGuiCol_ModalWindowDimBg]   = ImVec4(0.05f, 0.05f, 0.08f, 0.60f);
}

int main() {
    SDL_Init(SDL_INIT_VIDEO);
    SDL_Window* window = SDL_CreateWindow("BlockBlast Solver",
        SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
        1000, 600, SDL_WINDOW_SHOWN);
    SDL_Renderer* renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);

    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO();
    (void)io;

    ImGui_ImplSDL2_InitForSDLRenderer(window, renderer);
    ImGui_ImplSDLRenderer2_Init(renderer);

    ApplyBlockBlastTheme();

    bool showSolution = false;
    bool running = true;
    BlockBlastSolver solver;
    BlockBlastSolver::Solution result;
    int displayBoard[8][8] = {};

    // Filled cell color — warm red
    const ImVec4 colorFilled   = ImVec4(0.90f, 0.25f, 0.25f, 1.00f);
    // Empty cell color — dark slate
    const ImVec4 colorEmpty    = ImVec4(0.14f, 0.16f, 0.22f, 1.00f);
    // Newly placed piece color — bright cyan-green
    const ImVec4 colorPlaced   = ImVec4(0.20f, 0.85f, 0.55f, 1.00f);
    // Solve button accent
    const ImVec4 colorAccent   = ImVec4(0.22f, 0.60f, 0.95f, 1.00f);
    const ImVec4 colorAccentHov= ImVec4(0.30f, 0.70f, 1.00f, 1.00f);
    const ImVec4 colorAccentAct= ImVec4(0.18f, 0.52f, 0.85f, 1.00f);
    // Done button
    const ImVec4 colorDone     = ImVec4(0.28f, 0.28f, 0.36f, 1.00f);
    const ImVec4 colorDoneHov  = ImVec4(0.36f, 0.36f, 0.48f, 1.00f);
    const ImVec4 colorDoneAct  = ImVec4(0.22f, 0.22f, 0.30f, 1.00f);

    while (running) {
        SDL_Event event;
        while (SDL_PollEvent(&event))
            if (event.type == SDL_QUIT) running = false;
            else ImGui_ImplSDL2_ProcessEvent(&event);

        ImGui_ImplSDLRenderer2_NewFrame();
        ImGui_ImplSDL2_NewFrame();
        ImGui::NewFrame();

        // Left panel - board setup
        ImGui::SetNextWindowPos(ImVec2(0, 0), ImGuiCond_Always);
        ImGui::SetNextWindowSize(ImVec2(500, 600), ImGuiCond_Always);
        ImGui::Begin("Board Setup", nullptr, ImGuiWindowFlags_NoResize | ImGuiWindowFlags_NoMove | ImGuiWindowFlags_NoCollapse);

        ImGui::TextColored(ImVec4(0.55f, 0.65f, 0.85f, 1.0f), "CURRENT BOARD");
        ImGui::Spacing();

        // Board grid with subtle group background
        ImGui::PushStyleColor(ImGuiCol_ChildBg, ImVec4(0.10f, 0.11f, 0.15f, 1.0f));
        ImGui::BeginChild("BoardGrid", ImVec2(368, 368), false);
        ImGui::Spacing();
        for (int row = 0; row < 8; row++) {
            ImGui::Indent(8.0f);
            for (int col = 0; col < 8; col++) {
                if (col > 0) ImGui::SameLine(0, 3);
                char id[16];
                snprintf(id, sizeof(id), "##A%d_%d", row, col);
                bool cellValue = showSolution ? displayBoard[row][col] : board[row][col];
                ImGui::PushStyleColor(ImGuiCol_Button,        cellValue ? colorFilled : colorEmpty);
                ImGui::PushStyleColor(ImGuiCol_ButtonHovered, cellValue ? ImVec4(1.0f,0.38f,0.38f,1.0f) : ImVec4(0.22f,0.25f,0.34f,1.0f));
                ImGui::PushStyleColor(ImGuiCol_ButtonActive,  cellValue ? ImVec4(0.75f,0.18f,0.18f,1.0f) : ImVec4(0.28f,0.32f,0.44f,1.0f));
                if (ImGui::Button(id, ImVec2(42, 42))) {
                    if (!showSolution) board[row][col] = !board[row][col];
                }
                ImGui::PopStyleColor(3);
            }
            ImGui::Unindent(8.0f);
        }
        ImGui::EndChild();
        ImGui::PopStyleColor();

        ImGui::Spacing();
        ImGui::Separator();
        ImGui::Spacing();

        ImGui::TextColored(ImVec4(0.55f, 0.65f, 0.85f, 1.0f), "PIECES TO PLACE");
        ImGui::Spacing();

        auto drawPiece = [&](const char* label, bool pieceBoard[5][5],
                      std::unordered_set<Point, PointHash>& piece, char prefix) {
            ImGui::BeginGroup();
            ImGui::TextColored(ImVec4(0.65f, 0.70f, 0.85f, 1.0f), "%s", label);
            ImGui::Spacing();
            for (int row = 0; row < 5; row++) {
                for (int col = 0; col < 5; col++) {
                    if (col > 0) ImGui::SameLine(0, 2);
                    char id[16];
                    snprintf(id, sizeof(id), "##%c%d_%d", prefix, row, col);
                    ImGui::PushStyleColor(ImGuiCol_Button,        pieceBoard[row][col] ? colorFilled : colorEmpty);
                    ImGui::PushStyleColor(ImGuiCol_ButtonHovered, pieceBoard[row][col] ? ImVec4(1.0f,0.38f,0.38f,1.0f) : ImVec4(0.22f,0.25f,0.34f,1.0f));
                    ImGui::PushStyleColor(ImGuiCol_ButtonActive,  pieceBoard[row][col] ? ImVec4(0.75f,0.18f,0.18f,1.0f) : ImVec4(0.28f,0.32f,0.44f,1.0f));
                    if (ImGui::Button(id, ImVec2(22, 22))) {
                        if (!showSolution) {
                            pieceBoard[row][col] = !pieceBoard[row][col];
                            Point point = {col, row};
                            if (pieceBoard[row][col]) piece.insert(point);
                            else piece.erase(point);
                        }
                    }
                    ImGui::PopStyleColor(3);
                }
            }
            ImGui::EndGroup();
        };

        drawPiece("Piece 1", board1, piece1, 'B');
        ImGui::SameLine(0, 24);
        drawPiece("Piece 2", board2, piece2, 'C');
        ImGui::SameLine(0, 24);
        drawPiece("Piece 3", board3, piece3, 'D');

        ImGui::Spacing();
        ImGui::Separator();
        ImGui::Spacing();

        ImGui::PushStyleColor(ImGuiCol_Button,        colorAccent);
        ImGui::PushStyleColor(ImGuiCol_ButtonHovered, colorAccentHov);
        ImGui::PushStyleColor(ImGuiCol_ButtonActive,  colorAccentAct);
        ImGui::PushStyleVar(ImGuiStyleVar_FrameRounding, 8.0f);
        if (ImGui::Button("  Find Solution  ", ImVec2(160, 38))) {
            memcpy(displayBoard, board, sizeof(board)); // snapshot before solving
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
        ImGui::PopStyleVar();
        ImGui::PopStyleColor(3);

        ImGui::End();

        // Right panel - solution
        if (showSolution) {
            ImGui::SetNextWindowPos(ImVec2(500, 0), ImGuiCond_Always);
            ImGui::SetNextWindowSize(ImVec2(500, 600), ImGuiCond_Always);
            ImGui::Begin("Solution", &showSolution, ImGuiWindowFlags_NoResize | ImGuiWindowFlags_NoMove | ImGuiWindowFlags_NoCollapse);

            if (result.found) {
                ImGui::TextColored(ImVec4(0.30f, 0.90f, 0.55f, 1.0f), "SOLUTION FOUND");
                ImGui::Spacing();

                for (int i = 0; i < 3; i++) {
                    ImGui::TextColored(ImVec4(0.55f, 0.65f, 0.85f, 1.0f), "Move %d", i + 1);
                    ImGui::Spacing();
                    for (int row = 0; row < 8; row++) {
                        for (int col = 0; col < 8; col++) {
                            if (col > 0) ImGui::SameLine(0, 3);
                            char id[16];
                            snprintf(id, sizeof(id), "##S%d_%d_%d", i, row, col);
                            ImVec4 cellColor =
                                moves[i][row][col] == 0 ? colorEmpty :
                                moves[i][row][col] == 2 ? colorPlaced :
                                colorFilled;
                            ImGui::PushStyleColor(ImGuiCol_Button,        cellColor);
                            ImGui::PushStyleColor(ImGuiCol_ButtonHovered, cellColor);
                            ImGui::PushStyleColor(ImGuiCol_ButtonActive,  cellColor);
                            ImGui::Button(id, ImVec2(30, 30));
                            ImGui::PopStyleColor(3);
                        }
                    }
                    ImGui::Spacing();
                    if (i < 2) {
                        ImGui::Separator();
                        ImGui::Spacing();
                    }
                }
            } else {
                ImGui::Spacing();
                if (checkEmpty(piece1, piece2, piece3)) 
                {
                    ImGui::TextColored(ImVec4(0.75f, 0.75f, 0.85f, 1.0f), "Please place at least one block.");
                }
                else
                {
                    ImGui::TextColored(ImVec4(0.90f, 0.35f, 0.35f, 1.0f), "No solution exists for this configuration.");
                }
            }

            ImGui::Spacing();
            ImGui::Separator();
            ImGui::Spacing();

            ImGui::PushStyleColor(ImGuiCol_Button,        colorDone);
            ImGui::PushStyleColor(ImGuiCol_ButtonHovered, colorDoneHov);
            ImGui::PushStyleColor(ImGuiCol_ButtonActive,  colorDoneAct);
            ImGui::PushStyleVar(ImGuiStyleVar_FrameRounding, 8.0f);
            if (ImGui::Button("  Done Solving  ", ImVec2(150, 38))) {
                showSolution = false;
                resetPieces(board1, board2, board3, piece1, piece2, piece3);
            }
            ImGui::PopStyleVar();
            ImGui::PopStyleColor(3);

            ImGui::End();
        }

        ImGui::Render();
        SDL_SetRenderDrawColor(renderer, 13, 14, 18, 255);
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