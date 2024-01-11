module.exports = (sequelize, DataTypes) => {
const User = sequelize.define(
    "user",
    {
        userId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            set(value) {
                this.setDataValue("password", value);
            },
        },
        verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
    },
    {
        tableName: "user",
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
return User;
};
