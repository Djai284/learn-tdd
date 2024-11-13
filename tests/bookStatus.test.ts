import { Response } from "express";
import BookInstance from "../models/bookinstance";
import { showAllBooksStatus } from "../pages/books_status";

describe("Book Status Tests", () => {
    let res: Partial<Response>;
    
    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        jest.clearAllMocks();
    });

    describe("showAllBooksStatus", () => {
        it("should return all books with status 'Available'", async () => {
            const mockBookInstances = [
                { book: { title: "Mock Book Title" }, status: "Available" },
                { book: { title: "Mock Book Title 2" }, status: "Available" },
            ];

            BookInstance.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBookInstances)
            });

            await showAllBooksStatus(res as Response);

            expect(BookInstance.find).toHaveBeenCalledWith({ status: { $eq: "Available" } });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith([
                "Mock Book Title : Available",
                "Mock Book Title 2 : Available",
            ]);
        });

        it("should return empty list if no books are available", async () => {
            BookInstance.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue([])
            });

            await showAllBooksStatus(res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith([]);
        });

        it("should handle database connection errors", async () => {
            BookInstance.find = jest.fn().mockImplementation(() => {
                throw new Error('Database connection error');
            });

            await showAllBooksStatus(res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Status not found');
        });

        it("should handle null or undefined title", async () => {
            const mockBookInstances = [
                { book: { title: "Mock Book Title" }, status: "Available" },
                { book: { title: undefined }, status: "Available" },
                { book: { title: null }, status: "Available" }
            ];

            BookInstance.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBookInstances)
            });

            await showAllBooksStatus(res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith([
                "Mock Book Title : Available",
                "undefined : Available",
                "null : Available"
            ]);
        });

        it("should handle missing or incomplete book references as an error", async () => {
            const mockBookInstances = [
                { book: null, status: "Available" },
                { book: undefined, status: "Available" },
                { book: {}, status: "Available" }
            ];

            BookInstance.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBookInstances)
            });

            await showAllBooksStatus(res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Status not found');
        });

        it("should handle populate failure", async () => {
            BookInstance.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('Populate failed'))
            });

            await showAllBooksStatus(res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Status not found');
        });

        it("should handle mixed status book instances but only return Available ones", async () => {
            const mockBookInstances = [
                { book: { title: "Available Book" }, status: "Available" },
                { book: { title: "Another Available" }, status: "Available" }
            ];

            BookInstance.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBookInstances)
            });

            await showAllBooksStatus(res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith([
                "Available Book : Available",
                "Another Available : Available"
            ]);
        });
    });
});