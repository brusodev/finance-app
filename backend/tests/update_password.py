"""Script para atualizar a senha do usuário bruno"""
from app.database import SessionLocal
from app.models import User
from app.utils import hash_password


def update_password():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == 'bruno').first()
        if user:
            user.hashed_password = hash_password('@Kingston4701')
            db.commit()
            print('✅ Senha do usuario bruno atualizada para @Kingston4701')
        else:
            print('❌ Usuario bruno nao encontrado')
    except Exception as e:
        print(f'❌ Erro: {e}')
    finally:
        db.close()


if __name__ == '__main__':
    update_password()
