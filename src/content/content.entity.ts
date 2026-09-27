import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Subscriber { @PrimaryGeneratedColumn('uuid') id: string; @Column({ unique: true }) email: string; @CreateDateColumn() createdAt: Date; }

@Entity()
export class Post { @PrimaryGeneratedColumn('uuid') id: string; @Column() title: string; @Column({ unique: true }) slug: string; @Column('text') body: string; @Column({ nullable: true }) image: string; @CreateDateColumn() createdAt: Date; }

@Entity()
export class Review { @PrimaryGeneratedColumn('uuid') id: string; @Column() productId: string; @Column() name: string; @Column('int') rating: number; @Column('text') text: string; @CreateDateColumn() createdAt: Date; }

@Entity()
export class Message { @PrimaryGeneratedColumn('uuid') id: string; @Column() name: string; @Column() email: string; @Column('text') text: string; @CreateDateColumn() createdAt: Date; }
