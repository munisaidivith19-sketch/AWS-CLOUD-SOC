import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from functools import lru_cache
from utils.logger import get_logger
import os

logger = get_logger(__name__)


@lru_cache(maxsize=1)
def get_dynamodb_resource():
    from dotenv import load_dotenv
    load_dotenv()
    return boto3.resource(
        "dynamodb",
        region_name=os.getenv("AWS_REGION", "ap-south-2"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
    )


def get_table(table_name: str):
    return get_dynamodb_resource().Table(table_name)


class DynamoDBClient:
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.table      = get_table(table_name)

    def put_item(self, item: dict) -> bool:
        try:
            self.table.put_item(Item=item)
            return True
        except ClientError as e:
            logger.error(f"[{self.table_name}] put_item: {e}")
            return False
        except Exception as e:
            logger.error(f"[{self.table_name}] put_item unexpected: {e}")
            return False

    def get_item(self, key: dict) -> dict | None:
        try:
            resp = self.table.get_item(Key=key)
            return resp.get("Item")
        except ClientError as e:
            logger.error(f"[{self.table_name}] get_item: {e}")
            return None
        except Exception as e:
            logger.error(f"[{self.table_name}] get_item unexpected: {e}")
            return None

    def scan_items(self, filter_expression=None, limit: int = 100, last_key: dict = None) -> dict:
        try:
            kwargs = {"Limit": limit}
            if filter_expression is not None:
                kwargs["FilterExpression"] = filter_expression
            if last_key:
                kwargs["ExclusiveStartKey"] = last_key
            resp = self.table.scan(**kwargs)
            return {
                "items":    resp.get("Items", []),
                "last_key": resp.get("LastEvaluatedKey")
            }
        except ClientError as e:
            logger.error(f"[{self.table_name}] scan: {e}")
            return {"items": [], "last_key": None}
        except Exception as e:
            logger.error(f"[{self.table_name}] scan unexpected: {e}")
            return {"items": [], "last_key": None}

    def query_items(self, index_name: str, key_condition, filter_expression=None,
                    limit: int = 100, scan_index_forward: bool = False) -> list:
        try:
            kwargs = {
                "IndexName":              index_name,
                "KeyConditionExpression": key_condition,
                "ScanIndexForward":       scan_index_forward,
                "Limit":                  limit,
            }
            if filter_expression is not None:
                kwargs["FilterExpression"] = filter_expression
            resp = self.table.query(**kwargs)
            return resp.get("Items", [])
        except ClientError as e:
            logger.error(f"[{self.table_name}] query: {e}")
            return []
        except Exception as e:
            logger.error(f"[{self.table_name}] query unexpected: {e}")
            return []

    def update_item(self, key: dict, update_expr: str, expr_values: dict,
                    expr_names: dict = None) -> bool:
        try:
            kwargs = {
                "Key":                       key,
                "UpdateExpression":          update_expr,
                "ExpressionAttributeValues": expr_values,
                "ReturnValues":              "UPDATED_NEW",
            }
            if expr_names:
                kwargs["ExpressionAttributeNames"] = expr_names
            self.table.update_item(**kwargs)
            return True
        except ClientError as e:
            logger.error(f"[{self.table_name}] update_item: {e}")
            return False
        except Exception as e:
            logger.error(f"[{self.table_name}] update_item unexpected: {e}")
            return False

    def delete_item(self, key: dict) -> bool:
        try:
            self.table.delete_item(Key=key)
            return True
        except ClientError as e:
            logger.error(f"[{self.table_name}] delete_item: {e}")
            return False
        except Exception as e:
            logger.error(f"[{self.table_name}] delete_item unexpected: {e}")
            return False

    def scan_all(self, filter_expression=None) -> list:
        """Scan entire table regardless of size using pagination."""
        items    = []
        last_key = None
        while True:
            result   = self.scan_items(filter_expression=filter_expression, limit=1000, last_key=last_key)
            items   += result["items"]
            last_key = result.get("last_key")
            if not last_key:
                break
        return items