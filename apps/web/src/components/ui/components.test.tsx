/**
 * AC: All 10 shadcn/ui components are available in components/ui/ and render without errors.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Label } from './label';
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Separator } from './separator';
import { Avatar } from './avatar';

describe('UI component availability (AC: 10 required components)', () => {
  it('Button renders', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button', { name: 'Test' })).toBeDefined();
  });

  it('Input renders', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeDefined();
  });

  it('Textarea renders', () => {
    render(<Textarea placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeDefined();
  });

  it('Label renders', () => {
    render(<Label>My Label</Label>);
    expect(screen.getByText('My Label')).toBeDefined();
  });

  it('Badge renders', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeDefined();
  });

  it('Card renders', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>Card body</CardContent>
      </Card>,
    );
    expect(screen.getByText('Card Title')).toBeDefined();
    expect(screen.getByText('Card body')).toBeDefined();
  });

  it('Table renders', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Alice')).toBeDefined();
  });

  it('Separator renders', () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).not.toBeNull();
  });

  it('Avatar renders with fallback', () => {
    render(<Avatar fallback="AB" />);
    expect(screen.getByText('AB')).toBeDefined();
  });
});

describe('Input min-height (AC: form inputs 40px minimum)', () => {
  it('Input has h-10 class (40px height)', () => {
    const { container } = render(<Input />);
    const input = container.querySelector('input');
    expect(input).not.toBeNull();
    expect(input!.className).toContain('h-10');
  });
});
