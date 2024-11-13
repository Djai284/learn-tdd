import { Response } from 'express';
import Author from '../models/author';
import { getAuthorList, showAllAuthors } from '../pages/authors';

describe('Author List Tests', () => {
    let res: Partial<Response>;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        jest.clearAllMocks();
    });

    describe('getAuthorList', () => {
        it('should fetch and format the authors list correctly', async () => {
            const sortedAuthors = [
                {
                    first_name: 'Jane',
                    family_name: 'Austen',
                    date_of_birth: new Date('1775-12-16T12:00:00Z'),
                    date_of_death: new Date('1817-07-18T12:00:00Z')
                },
                {
                    first_name: 'Amitav',
                    family_name: 'Ghosh',
                    date_of_birth: new Date('1835-11-30T12:00:00Z'),
                    date_of_death: new Date('1910-04-21T12:00:00Z')
                }
            ];

            // Mock the Author model's behavior for the virtual properties
            sortedAuthors.forEach(author => {
                Object.defineProperty(author, 'name', {
                    get: function() { return `${this.family_name}, ${this.first_name}`; }
                });
                Object.defineProperty(author, 'lifespan', {
                    get: function() {
                        let span = '';
                        if (this.date_of_birth) span = this.date_of_birth.getUTCFullYear().toString();
                        span += ' - ';
                        if (this.date_of_death) span += this.date_of_death.getUTCFullYear().toString();
                        return span;
                    }
                });
            });

            const mockFind = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(sortedAuthors)
            });
            Author.find = mockFind;

            const result = await getAuthorList();

            expect(result).toEqual([
                'Austen, Jane : 1775 - 1817',
                'Ghosh, Amitav : 1835 - 1910'
            ]);
        });

        it('should handle authors with missing death dates', async () => {
            const author = {
                first_name: 'Modern',
                family_name: 'Author',
                date_of_birth: new Date('1975-01-01T12:00:00Z'),
                date_of_death: null
            };

            // Mock the virtual properties
            Object.defineProperty(author, 'name', {
                get: function() { return `${this.family_name}, ${this.first_name}`; }
            });
            Object.defineProperty(author, 'lifespan', {
                get: function() {
                    let span = '';
                    if (this.date_of_birth) span = this.date_of_birth.getUTCFullYear().toString();
                    span += ' - ';
                    if (this.date_of_death) span += this.date_of_death.getUTCFullYear().toString();
                    return span;
                }
            });

            Author.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([author])
            });

            const result = await getAuthorList();
            const expectedYear = author.date_of_birth.getUTCFullYear();
            expect(result).toEqual([`Author, Modern : ${expectedYear} - `]);
        });

        it('should handle authors with missing birth dates', async () => {
            const author = {
                first_name: 'Ancient',
                family_name: 'Author',
                date_birth: null,
                date_of_death: new Date('1800-01-01T12:00:00Z')
            };

            // Mock the virtual properties
            Object.defineProperty(author, 'name', {
                get: function() { return `${this.family_name}, ${this.first_name}`; }
            });
            Object.defineProperty(author, 'lifespan', {
                get: function() {
                    let span = '';
                    if (this.date_of_birth) span = this.date_of_birth.getUTCFullYear().toString();
                    span += ' - ';
                    if (this.date_of_death) span += this.date_of_death.getUTCFullYear().toString();
                    return span;
                }
            });

            Author.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([author])
            });

            const result = await getAuthorList();
            const expectedYear = author.date_of_death.getUTCFullYear();
            expect(result).toEqual([`Author, Ancient :  - ${expectedYear}`]);
        });

        it('should handle authors with no dates', async () => {
            const author = {
                first_name: 'Unknown',
                family_name: 'Author',
                date_of_birth: null,
                date_of_death: null
            };

            // Mock the virtual properties
            Object.defineProperty(author, 'name', {
                get: function() { return `${this.family_name}, ${this.first_name}`; }
            });
            Object.defineProperty(author, 'lifespan', {
                get: function() { return ' - '; }
            });

            Author.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([author])
            });

            const result = await getAuthorList();
            expect(result).toEqual(['Author, Unknown :  - ']);
        });

        it('should return empty array when database error occurs', async () => {
            Author.find = jest.fn().mockImplementation(() => {
                throw new Error('Database error');
            });

            const result = await getAuthorList();
            expect(result).toEqual([]);
        });
    });

    // The showAllAuthors tests remain the same...
    describe('showAllAuthors', () => {
        it('should send author list when authors exist', async () => {
            const mockAuthors = [
                {
                    first_name: 'Author',
                    family_name: '1',
                    date_of_birth: new Date('1900-01-01T12:00:00Z'),
                    date_of_death: new Date('1980-01-01T12:00:00Z')
                },
                {
                    first_name: 'Author',
                    family_name: '2',
                    date_of_birth: new Date('1920-01-01T12:00:00Z'),
                    date_of_death: new Date('2000-01-01T12:00:00Z')
                }
            ];

            // Mock virtual properties for each author
            mockAuthors.forEach(author => {
                Object.defineProperty(author, 'name', {
                    get: function() { return `${this.family_name}, ${this.first_name}`; }
                });
                Object.defineProperty(author, 'lifespan', {
                    get: function() {
                        let span = '';
                        if (this.date_of_birth) span = this.date_of_birth.getUTCFullYear().toString();
                        span += ' - ';
                        if (this.date_of_death) span += this.date_of_death.getUTCFullYear().toString();
                        return span;
                    }
                });
            });

            jest.spyOn(Author, 'find').mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockAuthors)
            } as any);

            await showAllAuthors(res as Response);

            expect(res.send).toHaveBeenCalledWith(expect.arrayContaining([
                expect.stringMatching(/Author/),
                expect.stringMatching(/Author/)
            ]));
        });

        it('should send "No authors found" when no authors exist', async () => {
            jest.spyOn(Author, 'find').mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            } as any);

            await showAllAuthors(res as Response);

            expect(res.send).toHaveBeenCalledWith('No authors found');
        });

        it('should handle database errors gracefully', async () => {
            jest.spyOn(Author, 'find').mockImplementation(() => {
                throw new Error('Database error');
            });

            await showAllAuthors(res as Response);

            expect(res.send).toHaveBeenCalledWith('No authors found');
        });
    });
});