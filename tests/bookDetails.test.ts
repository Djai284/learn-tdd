import { Response } from 'express';
import Book from '../models/book';
import BookInstance from '../models/bookinstance';
import { showBookDtls } from '../pages/book_details';

describe('Book Details Tests', () => {
    let res: Partial<Response>;
    const mockBook = {
        title: 'Mock Book Title',
        author: { name: 'Mock Author' }
    };
    const mockCopies = [
        { imprint: 'First Edition', status: 'Available' },
        { imprint: 'Second Edition', status: 'Loaned' }
    ];

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('showBookDtls', () => {
        it('should return complete book details when book and copies exist', async () => {
            const mockFindOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockBook)
            });
            Book.findOne = mockFindOne;

            const mockFind = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockCopies)
            });
            BookInstance.find = mockFind;

            await showBookDtls(res as Response, '12345');

            expect(mockFindOne).toHaveBeenCalledWith({ _id: '12345' });
            expect(mockFindOne().populate).toHaveBeenCalledWith('author');
            expect(mockFind).toHaveBeenCalledWith({ book: '12345' });
            expect(mockFind().select).toHaveBeenCalledWith('imprint status');
            expect(res.send).toHaveBeenCalledWith({
                title: mockBook.title,
                author: mockBook.author.name,
                copies: mockCopies
            });
        });

        it('should return 404 when book does not exist', async () => {
            Book.findOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(null)
            });

            await showBookDtls(res as Response, '12345');

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith('Book 12345 not found');
        });

        it('should return 404 when book exists but has no copies', async () => {
            Book.findOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockBook)
            });

            BookInstance.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(null)
            });

            await showBookDtls(res as Response, '12345');

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith('Book details not found for book 12345');
        });

        it('should return 404 for invalid book ID format', async () => {
            Book.findOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(null)
            });

            await showBookDtls(res as Response, 'invalid-id');

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith('Book invalid-id not found');
        });

        it('should handle database connection errors for book lookup', async () => {
            Book.findOne = jest.fn().mockImplementation(() => {
                throw new Error('Database connection failed');
            });

            await showBookDtls(res as Response, '12345');

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Error fetching book 12345');
        });

        it('should handle database connection errors for copies lookup', async () => {
            Book.findOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockBook)
            });

            BookInstance.find = jest.fn().mockImplementation(() => {
                throw new Error('Database connection failed');
            });

            await showBookDtls(res as Response, '12345');

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Error fetching book 12345');
        });

        it('should handle empty copies array', async () => {
            Book.findOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockBook)
            });

            BookInstance.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([])
            });

            await showBookDtls(res as Response, '12345');

            expect(res.send).toHaveBeenCalledWith({
                title: mockBook.title,
                author: mockBook.author.name,
                copies: []
            });
        });

        it('should handle null response from book lookup', async () => {
            Book.findOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(null)
            });

            await showBookDtls(res as Response, '12345');

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith('Book 12345 not found');
        });
    });
});