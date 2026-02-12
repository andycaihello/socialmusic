"""WeChat OAuth authentication"""
import requests
import hashlib
import time
from flask import Blueprint, request, jsonify, redirect
from app.extensions import db
from app.models.user import User
from flask_jwt_extended import create_access_token, create_refresh_token
from datetime import timedelta

bp = Blueprint('wechat_auth', __name__)

# 微信开放平台配置（需要在微信开放平台注册后填入）
WECHAT_APP_ID = 'YOUR_WECHAT_APP_ID'  # 替换为你的AppID
WECHAT_APP_SECRET = 'YOUR_WECHAT_APP_SECRET'  # 替换为你的AppSecret
WECHAT_REDIRECT_URI = 'https://app.onbeat.com.cn/api/auth/wechat/callback'  # 回调地址

# 微信API地址
WECHAT_AUTHORIZE_URL = 'https://open.weixin.qq.com/connect/qrconnect'  # PC扫码
WECHAT_OAUTH_URL = 'https://open.weixin.qq.com/connect/oauth2/authorize'  # 移动端
WECHAT_ACCESS_TOKEN_URL = 'https://api.weixin.qq.com/sns/oauth2/access_token'
WECHAT_USER_INFO_URL = 'https://api.weixin.qq.com/sns/userinfo'


@bp.route('/wechat/login', methods=['GET'])
def wechat_login():
    """
    微信登录入口（仅支持移动端）
    注意：使用移动应用AppID，不支持PC扫码
    """
    state = hashlib.md5(str(time.time()).encode()).hexdigest()[:16]

    # 移动端登录（在微信内打开）
    auth_url = (
        f"{WECHAT_OAUTH_URL}?"
        f"appid={WECHAT_APP_ID}&"
        f"redirect_uri={WECHAT_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=snsapi_userinfo&"
        f"state={state}#wechat_redirect"
    )

    return jsonify({
        'auth_url': auth_url,
        'state': state
    })


@bp.route('/wechat/callback', methods=['GET'])
def wechat_callback():
    """
    微信授权回调
    """
    code = request.args.get('code')
    state = request.args.get('state')
    
    if not code:
        return jsonify({'error': '授权失败，未获取到code'}), 400
    
    try:
        # 1. 通过code获取access_token
        token_response = requests.get(
            WECHAT_ACCESS_TOKEN_URL,
            params={
                'appid': WECHAT_APP_ID,
                'secret': WECHAT_APP_SECRET,
                'code': code,
                'grant_type': 'authorization_code'
            },
            timeout=10
        )
        token_data = token_response.json()
        
        if 'errcode' in token_data:
            return jsonify({'error': f"获取access_token失败: {token_data.get('errmsg')}"}), 400
        
        access_token = token_data.get('access_token')
        openid = token_data.get('openid')
        
        # 2. 通过access_token获取用户信息
        user_info_response = requests.get(
            WECHAT_USER_INFO_URL,
            params={
                'access_token': access_token,
                'openid': openid,
                'lang': 'zh_CN'
            },
            timeout=10
        )
        user_info = user_info_response.json()
        
        if 'errcode' in user_info:
            return jsonify({'error': f"获取用户信息失败: {user_info.get('errmsg')}"}), 400
        
        # 3. 查找或创建用户
        user = User.query.filter_by(wechat_openid=openid).first()
        
        if not user:
            # 创建新用户
            nickname = user_info.get('nickname', f'微信用户{openid[:8]}')
            avatar_url = user_info.get('headimgurl', '')
            
            # 生成唯一的用户名
            username = f'wx_{openid[:16]}'
            email = f'{openid}@wechat.user'
            
            user = User(
                username=username,
                email=email,
                nickname=nickname,
                avatar_url=avatar_url,
                wechat_openid=openid,
                wechat_unionid=user_info.get('unionid'),
                is_active=True
            )
            # 微信登录的用户不需要密码
            user.set_password(hashlib.md5(openid.encode()).hexdigest())
            
            db.session.add(user)
            db.session.commit()
        
        # 4. 生成JWT token
        access_token_jwt = create_access_token(
            identity=user.id,
            expires_delta=timedelta(days=7)
        )
        refresh_token_jwt = create_refresh_token(
            identity=user.id,
            expires_delta=timedelta(days=30)
        )
        
        # 5. 重定向到前端页面，带上token
        frontend_url = f"https://app.onbeat.com.cn/auth/wechat/callback?access_token={access_token_jwt}&refresh_token={refresh_token_jwt}"
        
        return redirect(frontend_url)
        
    except requests.RequestException as e:
        return jsonify({'error': f'请求微信API失败: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'登录失败: {str(e)}'}), 500


@bp.route('/wechat/bind', methods=['POST'])
def bind_wechat():
    """
    绑定微信账号（已登录用户绑定微信）
    """
    from app.utils.decorators import login_required
    
    @login_required
    def _bind(current_user_id):
        data = request.json
        code = data.get('code')
        
        if not code:
            return jsonify({'error': '缺少授权code'}), 400
        
        try:
            # 获取access_token和openid
            token_response = requests.get(
                WECHAT_ACCESS_TOKEN_URL,
                params={
                    'appid': WECHAT_APP_ID,
                    'secret': WECHAT_APP_SECRET,
                    'code': code,
                    'grant_type': 'authorization_code'
                },
                timeout=10
            )
            token_data = token_response.json()
            
            if 'errcode' in token_data:
                return jsonify({'error': f"获取access_token失败: {token_data.get('errmsg')}"}), 400
            
            openid = token_data.get('openid')
            unionid = token_data.get('unionid')
            
            # 检查openid是否已被其他用户绑定
            existing_user = User.query.filter_by(wechat_openid=openid).first()
            if existing_user and existing_user.id != current_user_id:
                return jsonify({'error': '该微信账号已被其他用户绑定'}), 400
            
            # 绑定微信
            user = db.session.get(User, current_user_id)
            user.wechat_openid = openid
            user.wechat_unionid = unionid
            
            db.session.commit()
            
            return jsonify({
                'message': '微信账号绑定成功',
                'user': user.to_dict()
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'绑定失败: {str(e)}'}), 500
    
    return _bind()


@bp.route('/wechat/unbind', methods=['POST'])
def unbind_wechat():
    """
    解绑微信账号
    """
    from app.utils.decorators import login_required
    
    @login_required
    def _unbind(current_user_id):
        try:
            user = db.session.get(User, current_user_id)
            
            if not user.wechat_openid:
                return jsonify({'error': '未绑定微信账号'}), 400
            
            user.wechat_openid = None
            user.wechat_unionid = None
            
            db.session.commit()
            
            return jsonify({
                'message': '微信账号解绑成功',
                'user': user.to_dict()
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'解绑失败: {str(e)}'}), 500
    
    return _unbind()
