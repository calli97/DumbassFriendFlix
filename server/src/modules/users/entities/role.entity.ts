import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { RoleName } from "../enums/role-name.enum";
import { User } from "./user.entity";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 50, unique: true })
  name: RoleName;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
