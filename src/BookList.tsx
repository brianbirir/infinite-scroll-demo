import React, { useState, useEffect } from 'react';

import { useVisibility } from './hook';

interface BookItemProps {
  title: string;
  description?: string | void;
  ref?: React.Ref<HTMLLIElement>;
}

interface BasicBook {
  key: string;
  title: string;
  description?: string | void;
}

// Open Library Book
interface OLBook {
  key: string;
  title: string;
  description: { value: string } | null;
  subtitle: string | null;
}

interface BookListProps {
  subject: string;
}

// Fetch the books and return an array of books
function fetchBooks(subject: string, offset: number = 0): Promise<BasicBook[]> {
  return fetch(
    `https://openlibrary.org/query.json?type=/type/work&subjects=${subject}&offset=${offset}&title=&description=&subtitle=`
  )
    .then<OLBook[]>((res) => res.json())
    .then<BasicBook[]>((res) => {
      return res.reduce((acc, book) => {
        return [
          ...acc,
          {
            key: book.key,
            title: book.subtitle
              ? `${book.title} ${book.subtitle}`
              : book.title,
            description: book.description ? book.description.value : undefined,
          },
        ];
      }, [] as BasicBook[]);
    });
}

const BookItem: React.ForwardRefExoticComponent<BookItemProps> = React.forwardRef(
  ({ title, description }, ref: React.Ref<HTMLLIElement>) => {
    return (
      <li className="book" ref={ref}>
        <h4>{title}</h4>
        {description && <p>{description}</p>}
      </li>
    );
  }
);

const BookList: React.FC<BookListProps> = ({ subject }) => {
  const [books, setBooks] = useState<BasicBook[]>([]);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadingCSS = {
    height: '100px',
    margin: '30px',
  };
  const loadingTextCSS = { display: isLoading ? 'block' : 'none' };

  const lastBook = useVisibility(
    (visible) => {
      if (visible) {
        setIsLoading(true);
        fetchBooks(subject, offset).then((newBooks) => {
          setOffset(offset + newBooks.length);
          setBooks([...books, ...newBooks]);
          setIsLoading(false);
        });
      }
    },
    [subject, books, offset]
  );

  useEffect(() => {
    fetchBooks(subject).then((newBooks) => {
      setBooks(newBooks);
      setOffset(newBooks.length);
      setIsLoading(false);
    });
  }, [subject]);

  return (
    <>
      <ul className="book-list">
        {books.map((book) => (
          <BookItem
            key={book.key}
            title={book.title}
            description={book.description}
            ref={books[books.length - 1].key === book.key ? lastBook : null}
          />
        ))}
      </ul>
      <div style={loadingCSS}>
        <span style={loadingTextCSS}>Loading...</span>
      </div>
    </>
  );
};

export default BookList;
